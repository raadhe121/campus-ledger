import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateSectionInput, UpdateSectionInput } from "@campus-ledger/validation-schemas";
import type { Section } from "@campus-ledger/shared-types";

function toPublic(row: {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  roomNo: string | null;
  classTeacherId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Section {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

async function findSectionOrThrow(sectionId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) throw new NotFoundError("Section not found");
  return section;
}

/** A section's class teacher must be an active TEACHER at this school — role membership alone doesn't imply eligibility (§07). */
async function assertValidClassTeacher(classTeacherId: string) {
  const teacher = await prisma.user.findUnique({ where: { id: classTeacherId } });
  if (!teacher || teacher.role !== "TEACHER") throw new ValidationError("classTeacherId must be an existing teacher at this school");
}

export async function createSection(input: CreateSectionInput, actorUserId: string, schoolId: string): Promise<Section> {
  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls) throw new NotFoundError("Class not found");

  const existing = await prisma.section.findFirst({ where: { classId: input.classId, name: input.name } });
  if (existing) throw new ConflictError("A section with this name already exists in this class");

  if (input.classTeacherId) await assertValidClassTeacher(input.classTeacherId);

  const section = await prisma.section.create({ data: { ...input, schoolId } });

  await writeAuditLog({ actorUserId, action: "section.create", targetSchoolId: schoolId, entity: "Section", entityId: section.id });

  return toPublic(section);
}

export async function listSections(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const classId = typeof query.classId === "string" ? query.classId : undefined;
  const where = classId ? { classId } : undefined;

  const [rows, total] = await Promise.all([
    prisma.section.findMany({ where, orderBy: { name: "asc" }, skip: page.skip, take: page.limit }),
    prisma.section.count({ where }),
  ]);

  return { sections: rows.map(toPublic), meta: paginationMeta(total, page) };
}

export async function getSection(sectionId: string): Promise<Section> {
  return toPublic(await findSectionOrThrow(sectionId));
}

export async function updateSection(sectionId: string, input: UpdateSectionInput, actorUserId: string, schoolId: string): Promise<Section> {
  await findSectionOrThrow(sectionId);
  if (input.classTeacherId) await assertValidClassTeacher(input.classTeacherId);

  const section = await prisma.section.update({ where: { id: sectionId }, data: input });

  await writeAuditLog({ actorUserId, action: "section.update", targetSchoolId: schoolId, entity: "Section", entityId: sectionId, diff: input });

  return toPublic(section);
}

export async function deleteSection(sectionId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findSectionOrThrow(sectionId);

  const enrollmentCount = await prisma.enrollment.count({ where: { sectionId } });
  if (enrollmentCount > 0) throw new ConflictError("This section still has enrolled students — transfer or withdraw them first");

  await prisma.section.delete({ where: { id: sectionId } });

  await writeAuditLog({ actorUserId, action: "section.delete", targetSchoolId: schoolId, entity: "Section", entityId: sectionId });
}
