import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateClassInput, UpdateClassInput } from "@campus-ledger/validation-schemas";
import type { Class } from "@campus-ledger/shared-types";

function toPublic(row: { id: string; schoolId: string; academicYearId: string; name: string; order: number; createdAt: Date; updatedAt: Date }): Class {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

async function findClassOrThrow(classId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new NotFoundError("Class not found");
  return cls;
}

export async function createClass(input: CreateClassInput, actorUserId: string, schoolId: string): Promise<Class> {
  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new NotFoundError("Academic year not found");

  const existing = await prisma.class.findFirst({ where: { academicYearId: input.academicYearId, name: input.name } });
  if (existing) throw new ConflictError("A class with this name already exists in this academic year");

  const cls = await prisma.class.create({ data: { ...input, schoolId } });

  await writeAuditLog({ actorUserId, action: "class.create", targetSchoolId: schoolId, entity: "Class", entityId: cls.id });

  return toPublic(cls);
}

export async function listClasses(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const academicYearId = typeof query.academicYearId === "string" ? query.academicYearId : undefined;
  const where = academicYearId ? { academicYearId } : undefined;

  const [rows, total] = await Promise.all([
    prisma.class.findMany({ where, orderBy: [{ order: "asc" }, { name: "asc" }], skip: page.skip, take: page.limit }),
    prisma.class.count({ where }),
  ]);

  return { classes: rows.map(toPublic), meta: paginationMeta(total, page) };
}

export async function getClass(classId: string): Promise<Class> {
  return toPublic(await findClassOrThrow(classId));
}

export async function updateClass(classId: string, input: UpdateClassInput, actorUserId: string, schoolId: string): Promise<Class> {
  await findClassOrThrow(classId);
  const cls = await prisma.class.update({ where: { id: classId }, data: input });

  await writeAuditLog({ actorUserId, action: "class.update", targetSchoolId: schoolId, entity: "Class", entityId: classId, diff: input });

  return toPublic(cls);
}

export async function deleteClass(classId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findClassOrThrow(classId);

  const sectionCount = await prisma.section.count({ where: { classId } });
  if (sectionCount > 0) throw new ConflictError("This class still has sections — remove them first");

  await prisma.class.delete({ where: { id: classId } });

  await writeAuditLog({ actorUserId, action: "class.delete", targetSchoolId: schoolId, entity: "Class", entityId: classId });
}
