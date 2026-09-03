import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateSubjectInput, UpdateSubjectInput } from "@campus-ledger/validation-schemas";
import type { Subject } from "@campus-ledger/shared-types";

function toPublic(row: {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isElective: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Subject {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

async function findSubjectOrThrow(subjectId: string) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new NotFoundError("Subject not found");
  return subject;
}

export async function createSubject(input: CreateSubjectInput, actorUserId: string, schoolId: string): Promise<Subject> {
  const existing = await prisma.subject.findFirst({ where: { code: input.code } });
  if (existing) throw new ConflictError("A subject with this code already exists");

  const subject = await prisma.subject.create({ data: { ...input, schoolId } });

  await writeAuditLog({ actorUserId, action: "subject.create", targetSchoolId: schoolId, entity: "Subject", entityId: subject.id });

  return toPublic(subject);
}

export async function listSubjects(query: Record<string, unknown>) {
  const page = parsePagination(query);

  const [rows, total] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" }, skip: page.skip, take: page.limit }),
    prisma.subject.count(),
  ]);

  return { subjects: rows.map(toPublic), meta: paginationMeta(total, page) };
}

export async function getSubject(subjectId: string): Promise<Subject> {
  return toPublic(await findSubjectOrThrow(subjectId));
}

export async function updateSubject(subjectId: string, input: UpdateSubjectInput, actorUserId: string, schoolId: string): Promise<Subject> {
  await findSubjectOrThrow(subjectId);
  const subject = await prisma.subject.update({ where: { id: subjectId }, data: input });

  await writeAuditLog({ actorUserId, action: "subject.update", targetSchoolId: schoolId, entity: "Subject", entityId: subjectId, diff: input });

  return toPublic(subject);
}

export async function deleteSubject(subjectId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findSubjectOrThrow(subjectId);
  await prisma.subject.delete({ where: { id: subjectId } });

  await writeAuditLog({ actorUserId, action: "subject.delete", targetSchoolId: schoolId, entity: "Subject", entityId: subjectId });
}
