import type { Prisma } from "@prisma/client";
import type { Role } from "@campus-ledger/shared-types";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateExamSubjectInput, UpdateExamSubjectInput, EnterMarksInput } from "@campus-ledger/validation-schemas";
import type { ExamSubjectWithDetails, MarksRosterEntry, Result } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  exam: true,
  subject: true,
  section: { include: { class: true } },
} as const;

type ExamSubjectRow = Prisma.ExamSubjectGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: ExamSubjectRow): ExamSubjectWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    examId: row.examId,
    subjectId: row.subjectId,
    sectionId: row.sectionId,
    maxMarks: row.maxMarks,
    passMarks: row.passMarks,
    examDate: row.examDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    exam: { id: row.exam.id, name: row.exam.name, type: row.exam.type },
    subject: { id: row.subject.id, name: row.subject.name, code: row.subject.code },
    section: { id: row.section.id, name: row.section.name, className: row.section.class.name },
  };
}

function toResult(row: { id: string; schoolId: string; examSubjectId: string; studentId: string; marksObtained: number; grade: string | null; remarks: string | null; enteredById: string; createdAt: Date; updatedAt: Date }): Result {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

/** §07: a Teacher's "CRU (own subject)" is decided the same way Phase 03 decided "own class" for attendance — a TimetableSlot linking this teacher to this exact subject+section, not a role check alone. */
async function assertTeacherOwnsSubject(subjectId: string, sectionId: string, actorRole: Role, actorId: string) {
  if (actorRole !== "TEACHER") return;
  const slot = await prisma.timetableSlot.findFirst({ where: { subjectId, sectionId, teacherId: actorId } });
  if (!slot) throw new ForbiddenError("You don't teach this subject to this section");
}

export async function createExamSubject(input: CreateExamSubjectInput, actorUserId: string, schoolId: string): Promise<ExamSubjectWithDetails> {
  const exam = await prisma.exam.findUnique({ where: { id: input.examId } });
  if (!exam) throw new NotFoundError("Exam not found");

  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) throw new NotFoundError("Subject not found");

  const section = await prisma.section.findUnique({ where: { id: input.sectionId } });
  if (!section) throw new NotFoundError("Section not found");

  if (input.passMarks > input.maxMarks) throw new ValidationError("passMarks cannot exceed maxMarks");

  const existing = await prisma.examSubject.findFirst({ where: { examId: input.examId, subjectId: input.subjectId, sectionId: input.sectionId } });
  if (existing) throw new ConflictError("This subject is already scheduled for this section in this exam");

  const examSubject = await prisma.examSubject.create({ data: { ...input, schoolId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "exam_subject.create", targetSchoolId: schoolId, entity: "ExamSubject", entityId: examSubject.id });

  return toDetails(examSubject);
}

export async function listExamSubjects(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.ExamSubjectWhereInput = {};
  if (typeof query.examId === "string") where.examId = query.examId;
  if (typeof query.sectionId === "string") where.sectionId = query.sectionId;

  const [rows, total] = await Promise.all([
    prisma.examSubject.findMany({ where, include: DETAIL_INCLUDE, orderBy: { examDate: "asc" }, skip: page.skip, take: page.limit }),
    prisma.examSubject.count({ where }),
  ]);

  return { examSubjects: rows.map(toDetails), meta: paginationMeta(total, page) };
}

/** §07: a Teacher's own slice — every ExamSubject for a subject+section they actually teach, per their own TimetableSlots. Called from modules/me, never the general browse-all list above. */
export async function listMyExamSubjects(teacherId: string): Promise<ExamSubjectWithDetails[]> {
  const slots = await prisma.timetableSlot.findMany({ where: { teacherId }, select: { subjectId: true, sectionId: true } });
  if (slots.length === 0) return [];

  const rows = await prisma.examSubject.findMany({
    where: { OR: slots.map((s) => ({ subjectId: s.subjectId, sectionId: s.sectionId })) },
    include: DETAIL_INCLUDE,
    orderBy: { examDate: "asc" },
  });

  return rows.map(toDetails);
}

async function findExamSubjectOrThrow(examSubjectId: string) {
  const examSubject = await prisma.examSubject.findUnique({ where: { id: examSubjectId }, include: DETAIL_INCLUDE });
  if (!examSubject) throw new NotFoundError("Exam subject not found");
  return examSubject;
}

export async function getExamSubject(examSubjectId: string): Promise<ExamSubjectWithDetails> {
  return toDetails(await findExamSubjectOrThrow(examSubjectId));
}

export async function updateExamSubject(examSubjectId: string, input: UpdateExamSubjectInput, actorUserId: string, schoolId: string): Promise<ExamSubjectWithDetails> {
  const existing = await findExamSubjectOrThrow(examSubjectId);

  const maxMarks = input.maxMarks ?? existing.maxMarks;
  const passMarks = input.passMarks ?? existing.passMarks;
  if (passMarks > maxMarks) throw new ValidationError("passMarks cannot exceed maxMarks");

  const examSubject = await prisma.examSubject.update({ where: { id: examSubjectId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "exam_subject.update", targetSchoolId: schoolId, entity: "ExamSubject", entityId: examSubjectId, diff: input });

  return toDetails(examSubject);
}

export async function deleteExamSubject(examSubjectId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findExamSubjectOrThrow(examSubjectId);
  await prisma.examSubject.delete({ where: { id: examSubjectId } }); // cascades its Results — trivial to re-enter, not worth a manual-clear guard

  await writeAuditLog({ actorUserId, action: "exam_subject.delete", targetSchoolId: schoolId, entity: "ExamSubject", entityId: examSubjectId });
}

/** The marks-entry screen's data source — every actively-enrolled student in the exam subject's section, joined with their existing Result if one exists. */
export async function getMarksRoster(examSubjectId: string, actorRole: Role, actorId: string): Promise<MarksRosterEntry[]> {
  const examSubject = await findExamSubjectOrThrow(examSubjectId);
  await assertTeacherOwnsSubject(examSubject.subjectId, examSubject.sectionId, actorRole, actorId);

  const [enrollments, results] = await Promise.all([
    prisma.enrollment.findMany({
      where: { sectionId: examSubject.sectionId, status: "ACTIVE" },
      include: { student: { include: { studentProfile: true } } },
      orderBy: { rollNo: "asc" },
    }),
    prisma.result.findMany({ where: { examSubjectId } }),
  ]);

  const byStudent = new Map(results.map((r) => [r.studentId, r]));

  return enrollments
    .filter((e) => e.student.studentProfile)
    .map((e) => ({
      studentId: e.studentId,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      admissionNo: e.student.studentProfile!.admissionNo,
      rollNo: e.rollNo,
      result: byStudent.has(e.studentId) ? toResult(byStudent.get(e.studentId)!) : null,
    }));
}

function computeGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

/** One bulk upsert per exam subject — re-entering a student's mark updates their existing row (the examSubjectId+studentId unique constraint is what makes that safe), same shape as attendance's markAttendance. */
export async function enterMarks(examSubjectId: string, input: EnterMarksInput, actorUserId: string, actorRole: Role, schoolId: string): Promise<Result[]> {
  const examSubject = await findExamSubjectOrThrow(examSubjectId);
  await assertTeacherOwnsSubject(examSubject.subjectId, examSubject.sectionId, actorRole, actorUserId);

  const activeIds = new Set(
    (await prisma.enrollment.findMany({ where: { sectionId: examSubject.sectionId, status: "ACTIVE" }, select: { studentId: true } })).map((e) => e.studentId),
  );

  for (const record of input.records) {
    if (!activeIds.has(record.studentId)) throw new ValidationError(`Student ${record.studentId} is not actively enrolled in this section`);
    if (record.marksObtained > examSubject.maxMarks) throw new ValidationError(`marksObtained cannot exceed maxMarks (${examSubject.maxMarks})`);
  }

  const results = await prisma.$transaction(
    input.records.map((r) => {
      const grade = r.grade ?? computeGrade((r.marksObtained / examSubject.maxMarks) * 100);
      return prisma.result.upsert({
        where: { examSubjectId_studentId: { examSubjectId, studentId: r.studentId } },
        create: { schoolId, examSubjectId, studentId: r.studentId, marksObtained: r.marksObtained, grade, remarks: r.remarks, enteredById: actorUserId },
        update: { marksObtained: r.marksObtained, grade, remarks: r.remarks ?? null, enteredById: actorUserId },
      });
    }),
  );

  await writeAuditLog({
    actorUserId,
    action: "result.enter_marks",
    targetSchoolId: schoolId,
    entity: "ExamSubject",
    entityId: examSubjectId,
    diff: { count: input.records.length },
  });

  return results.map(toResult);
}
