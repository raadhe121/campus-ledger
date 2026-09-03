import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateAcademicYearInput, UpdateAcademicYearInput } from "@campus-ledger/validation-schemas";
import type { AcademicYear } from "@campus-ledger/shared-types";

function toPublic(row: {
  id: string;
  schoolId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AcademicYear {
  return {
    ...row,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Neither `schoolId` (the Prisma extension in lib/prisma.ts stamps it from
// the caller's tenant context) nor a manual ownership check appears below —
// every lookup here goes through the same tenant-scoped `prisma` client
// users.service.ts uses, so a foreign id 404s before this code ever sees it.

export async function createAcademicYear(input: CreateAcademicYearInput, actorUserId: string, schoolId: string): Promise<AcademicYear> {
  const existing = await prisma.academicYear.findFirst({ where: { label: input.label } });
  if (existing) throw new ConflictError("An academic year with this label already exists");

  const year = await prisma.academicYear.create({ data: { ...input, schoolId } });

  await writeAuditLog({ actorUserId, action: "academic_year.create", targetSchoolId: schoolId, entity: "AcademicYear", entityId: year.id });

  return toPublic(year);
}

export async function listAcademicYears(query: Record<string, unknown>) {
  const page = parsePagination(query);

  const [rows, total] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" }, skip: page.skip, take: page.limit }),
    prisma.academicYear.count(),
  ]);

  return { years: rows.map(toPublic), meta: paginationMeta(total, page) };
}

async function findYearOrThrow(yearId: string) {
  const year = await prisma.academicYear.findUnique({ where: { id: yearId } });
  if (!year) throw new NotFoundError("Academic year not found");
  return year;
}

export async function getAcademicYear(yearId: string): Promise<AcademicYear> {
  return toPublic(await findYearOrThrow(yearId));
}

export async function updateAcademicYear(
  yearId: string,
  input: UpdateAcademicYearInput,
  actorUserId: string,
  schoolId: string,
): Promise<AcademicYear> {
  await findYearOrThrow(yearId);
  const year = await prisma.academicYear.update({ where: { id: yearId }, data: input });

  await writeAuditLog({ actorUserId, action: "academic_year.update", targetSchoolId: schoolId, entity: "AcademicYear", entityId: yearId, diff: input });

  return toPublic(year);
}

/** Sets this year active and every other year at the school inactive — at most one active year per school, enforced here rather than by a partial unique index Postgres can't express cleanly against a boolean. */
export async function activateAcademicYear(yearId: string, actorUserId: string, schoolId: string): Promise<AcademicYear> {
  await findYearOrThrow(yearId);

  await prisma.$transaction([
    prisma.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.academicYear.update({ where: { id: yearId }, data: { isActive: true } }),
  ]);

  await writeAuditLog({ actorUserId, action: "academic_year.activate", targetSchoolId: schoolId, entity: "AcademicYear", entityId: yearId });

  return getAcademicYear(yearId);
}

export async function deleteAcademicYear(yearId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findYearOrThrow(yearId);

  const classCount = await prisma.class.count({ where: { academicYearId: yearId } });
  if (classCount > 0) throw new ConflictError("This academic year still has classes — remove them first");

  await prisma.academicYear.delete({ where: { id: yearId } });

  await writeAuditLog({ actorUserId, action: "academic_year.delete", targetSchoolId: schoolId, entity: "AcademicYear", entityId: yearId });
}
