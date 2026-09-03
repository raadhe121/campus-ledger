import type { Prisma } from "@prisma/client";
import type { Role } from "@campus-ledger/shared-types";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateAssignmentInput, UpdateAssignmentInput, GradeSubmissionInput, SubmitAssignmentInput } from "@campus-ledger/validation-schemas";
import type { AssignmentWithDetails, AssignmentWithMySubmission, SubmissionWithStudent, Submission } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  section: { include: { class: true } },
  subject: true,
  createdBy: true,
} as const;

type AssignmentRow = Prisma.AssignmentGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: AssignmentRow): AssignmentWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    sectionId: row.sectionId,
    subjectId: row.subjectId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate.toISOString(),
    attachmentUrl: row.attachmentUrl,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    section: { id: row.section.id, name: row.section.name, className: row.section.class.name },
    subject: { id: row.subject.id, name: row.subject.name, code: row.subject.code },
    createdBy: { id: row.createdBy.id, firstName: row.createdBy.firstName, lastName: row.createdBy.lastName },
  };
}

function toSubmission(row: {
  id: string;
  schoolId: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: Date;
  grade: string | null;
  feedback: string | null;
  gradedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Submission {
  return { ...row, submittedAt: row.submittedAt.toISOString(), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

/** §07: Teacher's "Manage (own)" — an assignment can only be created for, and only ever managed by, a teacher who actually teaches that subject to that section (checked via TimetableSlot, same as exam-subjects' marks entry) and, past creation, only by whoever created it. */
async function assertTeacherOwnsSubject(subjectId: string, sectionId: string, actorId: string) {
  const slot = await prisma.timetableSlot.findFirst({ where: { subjectId, sectionId, teacherId: actorId } });
  if (!slot) throw new ForbiddenError("You don't teach this subject to this section");
}

function assertOwnAssignment(assignment: { createdById: string }, actorId: string) {
  if (assignment.createdById !== actorId) throw new ForbiddenError("You didn't create this assignment");
}

export async function createAssignment(input: CreateAssignmentInput, actorUserId: string, schoolId: string): Promise<AssignmentWithDetails> {
  const section = await prisma.section.findUnique({ where: { id: input.sectionId } });
  if (!section) throw new NotFoundError("Section not found");

  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) throw new NotFoundError("Subject not found");

  await assertTeacherOwnsSubject(input.subjectId, input.sectionId, actorUserId);

  const assignment = await prisma.assignment.create({ data: { ...input, schoolId, createdById: actorUserId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "assignment.create", targetSchoolId: schoolId, entity: "Assignment", entityId: assignment.id });

  return toDetails(assignment);
}

/** School Admin gets the whole school's list ("R"); Teacher's is force-filtered to their own regardless of query — "own" means only theirs, not "read all, write own" (§07). */
export async function listAssignments(query: Record<string, unknown>, actorRole: Role, actorId: string) {
  const page = parsePagination(query);
  const where: Prisma.AssignmentWhereInput = {};
  if (typeof query.sectionId === "string") where.sectionId = query.sectionId;
  if (typeof query.subjectId === "string") where.subjectId = query.subjectId;
  if (actorRole === "TEACHER") where.createdById = actorId;

  const [rows, total] = await Promise.all([
    prisma.assignment.findMany({ where, include: DETAIL_INCLUDE, orderBy: { dueDate: "desc" }, skip: page.skip, take: page.limit }),
    prisma.assignment.count({ where }),
  ]);

  return { assignments: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findAssignmentOrThrow(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: DETAIL_INCLUDE });
  if (!assignment) throw new NotFoundError("Assignment not found");
  return assignment;
}

export async function getAssignment(assignmentId: string, actorRole: Role, actorId: string): Promise<AssignmentWithDetails> {
  const assignment = await findAssignmentOrThrow(assignmentId);
  if (actorRole === "TEACHER") assertOwnAssignment(assignment, actorId);
  return toDetails(assignment);
}

export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput,
  actorUserId: string,
  schoolId: string,
): Promise<AssignmentWithDetails> {
  const existing = await findAssignmentOrThrow(assignmentId);
  assertOwnAssignment(existing, actorUserId);

  const assignment = await prisma.assignment.update({ where: { id: assignmentId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "assignment.update", targetSchoolId: schoolId, entity: "Assignment", entityId: assignmentId, diff: input });

  return toDetails(assignment);
}

export async function deleteAssignment(assignmentId: string, actorUserId: string, schoolId: string): Promise<void> {
  const existing = await findAssignmentOrThrow(assignmentId);
  assertOwnAssignment(existing, actorUserId);

  await prisma.assignment.delete({ where: { id: assignmentId } }); // cascades its Submissions

  await writeAuditLog({ actorUserId, action: "assignment.delete", targetSchoolId: schoolId, entity: "Assignment", entityId: assignmentId });
}

export async function listSubmissions(assignmentId: string, actorId: string): Promise<SubmissionWithStudent[]> {
  const assignment = await findAssignmentOrThrow(assignmentId);
  assertOwnAssignment(assignment, actorId);

  const rows = await prisma.submission.findMany({ where: { assignmentId }, include: { student: true }, orderBy: { submittedAt: "desc" } });

  return rows.map((r) => ({ ...toSubmission(r), student: { id: r.student.id, firstName: r.student.firstName, lastName: r.student.lastName, email: r.student.email } }));
}

export async function gradeSubmission(submissionId: string, input: GradeSubmissionInput, actorUserId: string, schoolId: string): Promise<Submission> {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { assignment: true } });
  if (!submission) throw new NotFoundError("Submission not found");
  assertOwnAssignment(submission.assignment, actorUserId);

  const updated = await prisma.submission.update({ where: { id: submissionId }, data: { ...input, gradedById: actorUserId } });

  await writeAuditLog({ actorUserId, action: "submission.grade", targetSchoolId: schoolId, entity: "Submission", entityId: submissionId, diff: input });

  return toSubmission(updated);
}

// ---- Self-scoped reads/writes, called from modules/me (§07: Student "R + submit") ----

/** Every assignment for the student's own current section, joined with their own submission if they've made one — never another student's. */
export async function listMyAssignments(studentId: string): Promise<AssignmentWithMySubmission[]> {
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId, status: "ACTIVE" } });
  if (!enrollment) return [];

  const rows = await prisma.assignment.findMany({
    where: { sectionId: enrollment.sectionId },
    include: { ...DETAIL_INCLUDE, submissions: { where: { studentId } } },
    orderBy: { dueDate: "desc" },
  });

  return rows.map((row) => ({ ...toDetails(row), mySubmission: row.submissions[0] ? toSubmission(row.submissions[0]) : null }));
}

/** A submission always writes as the caller — ownership isn't a check here, it's structural (studentId is never taken from the request body). A resubmission updates the existing row via the assignmentId+studentId unique constraint. */
export async function submitAssignment(assignmentId: string, input: SubmitAssignmentInput, studentId: string, schoolId: string): Promise<Submission> {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError("Assignment not found");

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId, sectionId: assignment.sectionId, status: "ACTIVE" } });
  if (!enrollment) throw new ForbiddenError("This assignment isn't for your section");

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: { schoolId, assignmentId, studentId, content: input.content },
    update: { content: input.content, submittedAt: new Date(), grade: null, feedback: null, gradedById: null },
  });

  await writeAuditLog({ actorUserId: studentId, action: "submission.submit", targetSchoolId: schoolId, entity: "Assignment", entityId: assignmentId });

  return toSubmission(submission);
}
