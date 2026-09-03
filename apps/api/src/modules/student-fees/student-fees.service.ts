import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { AssignStudentFeeInput, UpdateStudentFeeInput } from "@campus-ledger/validation-schemas";
import type { StudentFeeWithDetails, StudentFeeStatus } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  student: { include: { studentProfile: true } },
  feeItem: { include: { feeStructure: true } },
} as const;

type StudentFeeRow = Prisma.StudentFeeGetPayload<{ include: typeof DETAIL_INCLUDE }>;

/** §04's grade-computed-server-side pattern applied to money: never stored, always derived from the item's own due date and this charge's current status. */
function toDetails(row: StudentFeeRow): StudentFeeWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    studentId: row.studentId,
    feeItemId: row.feeItemId,
    amountDue: row.amountDue,
    amountPaid: row.amountPaid,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOverdue: row.status !== "PAID" && row.feeItem.dueDate.getTime() < Date.now(),
    feeItem: { id: row.feeItem.id, label: row.feeItem.label, amount: row.feeItem.amount, dueDate: row.feeItem.dueDate.toISOString() },
    feeStructure: { id: row.feeItem.feeStructure.id, name: row.feeItem.feeStructure.name, frequency: row.feeItem.feeStructure.frequency },
    student: {
      id: row.student.id,
      firstName: row.student.firstName,
      lastName: row.student.lastName,
      admissionNo: row.student.studentProfile?.admissionNo ?? null,
    },
  };
}

/** PENDING/PARTIAL/PAID from amounts alone — same helper the payments service reuses so both writers agree on what a status means. */
export function deriveStatus(amountDue: number, amountPaid: number): StudentFeeStatus {
  if (amountPaid <= 0) return "PENDING";
  if (amountPaid >= amountDue) return "PAID";
  return "PARTIAL";
}

export async function assignStudentFee(input: AssignStudentFeeInput, actorUserId: string, schoolId: string): Promise<StudentFeeWithDetails> {
  const student = await prisma.user.findUnique({ where: { id: input.studentId } });
  if (!student || student.role !== "STUDENT") throw new NotFoundError("Student not found");

  const feeItem = await prisma.feeItem.findUnique({ where: { id: input.feeItemId } });
  if (!feeItem) throw new NotFoundError("Fee item not found");

  const existing = await prisma.studentFee.findUnique({ where: { studentId_feeItemId: { studentId: input.studentId, feeItemId: input.feeItemId } } });
  if (existing) throw new ConflictError("This student already has a charge for this fee item");

  const studentFee = await prisma.studentFee.create({
    data: { schoolId, studentId: input.studentId, feeItemId: input.feeItemId, amountDue: input.amountDue ?? feeItem.amount },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({ actorUserId, action: "student_fee.assign", targetSchoolId: schoolId, entity: "StudentFee", entityId: studentFee.id });

  return toDetails(studentFee);
}

export async function listStudentFees(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.StudentFeeWhereInput = {};
  if (typeof query.studentId === "string") where.studentId = query.studentId;
  if (typeof query.feeItemId === "string") where.feeItemId = query.feeItemId;
  if (typeof query.status === "string") where.status = query.status as StudentFeeStatus;

  const [rows, total] = await Promise.all([
    prisma.studentFee.findMany({ where, include: DETAIL_INCLUDE, orderBy: { createdAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.studentFee.count({ where }),
  ]);

  return { studentFees: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findStudentFeeOrThrow(studentFeeId: string) {
  const studentFee = await prisma.studentFee.findUnique({ where: { id: studentFeeId }, include: DETAIL_INCLUDE });
  if (!studentFee) throw new NotFoundError("Student fee not found");
  return studentFee;
}

export async function getStudentFee(studentFeeId: string): Promise<StudentFeeWithDetails> {
  return toDetails(await findStudentFeeOrThrow(studentFeeId));
}

/** Adjusts amountDue — a concession or a waiver. `status` is re-derived here too, since lowering amountDue below amountPaid would otherwise leave a PARTIAL charge that's actually fully covered. */
export async function updateStudentFee(studentFeeId: string, input: UpdateStudentFeeInput, actorUserId: string, schoolId: string): Promise<StudentFeeWithDetails> {
  const existing = await findStudentFeeOrThrow(studentFeeId);
  if (input.amountDue < existing.amountPaid) throw new ValidationError("amountDue cannot be less than the amount already paid");

  const studentFee = await prisma.studentFee.update({
    where: { id: studentFeeId },
    data: { amountDue: input.amountDue, status: deriveStatus(input.amountDue, existing.amountPaid) },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({ actorUserId, action: "student_fee.update", targetSchoolId: schoolId, entity: "StudentFee", entityId: studentFeeId, diff: input });

  return toDetails(studentFee);
}

export async function deleteStudentFee(studentFeeId: string, actorUserId: string, schoolId: string): Promise<void> {
  const existing = await findStudentFeeOrThrow(studentFeeId);
  if (existing.amountPaid > 0) throw new ConflictError("Cannot delete a fee charge that already has payments recorded against it");

  await prisma.studentFee.delete({ where: { id: studentFeeId } });

  await writeAuditLog({ actorUserId, action: "student_fee.delete", targetSchoolId: schoolId, entity: "StudentFee", entityId: studentFeeId });
}

// ---- Self-scoped reads, called from modules/me (§07: Student "R (self)", Parent "R (children)") ----

export async function listMyFees(studentId: string): Promise<StudentFeeWithDetails[]> {
  const rows = await prisma.studentFee.findMany({ where: { studentId }, include: DETAIL_INCLUDE, orderBy: { feeItem: { dueDate: "asc" } } });
  return rows.map(toDetails);
}
