import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateExamInput, UpdateExamInput } from "@campus-ledger/validation-schemas";
import type { Exam } from "@campus-ledger/shared-types";

function toPublic(row: {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): Exam {
  return {
    ...row,
    type: row.type as Exam["type"],
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createExam(input: CreateExamInput, actorUserId: string, schoolId: string): Promise<Exam> {
  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new NotFoundError("Academic year not found");

  const existing = await prisma.exam.findFirst({ where: { academicYearId: input.academicYearId, name: input.name } });
  if (existing) throw new ConflictError("An exam with this name already exists in this academic year");

  const exam = await prisma.exam.create({ data: { ...input, schoolId } });

  await writeAuditLog({ actorUserId, action: "exam.create", targetSchoolId: schoolId, entity: "Exam", entityId: exam.id });

  return toPublic(exam);
}

export async function listExams(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const academicYearId = typeof query.academicYearId === "string" ? query.academicYearId : undefined;
  const where = academicYearId ? { academicYearId } : undefined;

  const [rows, total] = await Promise.all([
    prisma.exam.findMany({ where, orderBy: { startDate: "desc" }, skip: page.skip, take: page.limit }),
    prisma.exam.count({ where }),
  ]);

  return { exams: rows.map(toPublic), meta: paginationMeta(total, page) };
}

async function findExamOrThrow(examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new NotFoundError("Exam not found");
  return exam;
}

export async function getExam(examId: string): Promise<Exam> {
  return toPublic(await findExamOrThrow(examId));
}

export async function updateExam(examId: string, input: UpdateExamInput, actorUserId: string, schoolId: string): Promise<Exam> {
  await findExamOrThrow(examId);
  const exam = await prisma.exam.update({ where: { id: examId }, data: input });

  await writeAuditLog({ actorUserId, action: "exam.update", targetSchoolId: schoolId, entity: "Exam", entityId: examId, diff: input });

  return toPublic(exam);
}

export async function deleteExam(examId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findExamOrThrow(examId);

  const subjectCount = await prisma.examSubject.count({ where: { examId } });
  if (subjectCount > 0) throw new ConflictError("This exam still has subjects scheduled — remove them first");

  await prisma.exam.delete({ where: { id: examId } });

  await writeAuditLog({ actorUserId, action: "exam.delete", targetSchoolId: schoolId, entity: "Exam", entityId: examId });
}
