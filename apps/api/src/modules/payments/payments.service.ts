import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import { deriveStatus } from "../student-fees/student-fees.service.js";
import type { RecordPaymentInput } from "@campus-ledger/validation-schemas";
import type { PaymentWithDetails } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  receipt: true,
  receivedBy: true,
  studentFee: { include: { student: { include: { studentProfile: true } }, feeItem: { include: { feeStructure: true } } } },
} as const;

type PaymentRow = Prisma.PaymentGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: PaymentRow): PaymentWithDetails {
  if (!row.receipt) throw new Error("Payment loaded without its receipt — recordPayment always issues one in the same transaction");
  return {
    id: row.id,
    schoolId: row.schoolId,
    studentFeeId: row.studentFeeId,
    amount: row.amount,
    method: row.method,
    reference: row.reference,
    receivedById: row.receivedById,
    paidAt: row.paidAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    receipt: { ...row.receipt, issuedAt: row.receipt.issuedAt.toISOString() },
    receivedBy: { id: row.receivedBy.id, firstName: row.receivedBy.firstName, lastName: row.receivedBy.lastName },
    studentFee: {
      id: row.studentFee.id,
      student: {
        id: row.studentFee.student.id,
        firstName: row.studentFee.student.firstName,
        lastName: row.studentFee.student.lastName,
        admissionNo: row.studentFee.student.studentProfile?.admissionNo ?? null,
      },
      feeItem: { id: row.studentFee.feeItem.id, label: row.studentFee.feeItem.label },
      feeStructure: { id: row.studentFee.feeItem.feeStructure.id, name: row.studentFee.feeItem.feeStructure.name },
    },
  };
}

/**
 * §11's own demo line: "an accountant recording a payment and issuing a
 * receipt" — this is that action. One transaction: create the Payment,
 * roll it into the StudentFee's amountPaid/status, and issue exactly one
 * Receipt with the next number in this school's sequence. The route this
 * hangs off requires an Idempotency-Key header (§08); a retried request
 * never reaches this function a second time for the same key.
 */
export async function recordPayment(input: RecordPaymentInput, actorUserId: string, schoolId: string): Promise<PaymentWithDetails> {
  const studentFee = await prisma.studentFee.findUnique({ where: { id: input.studentFeeId } });
  if (!studentFee) throw new NotFoundError("Student fee not found");

  const newAmountPaid = studentFee.amountPaid + input.amount;
  if (newAmountPaid > studentFee.amountDue) {
    const remaining = studentFee.amountDue - studentFee.amountPaid;
    throw new ValidationError(`Payment of ${input.amount} would exceed the amount due (${remaining} remaining)`);
  }

  const paymentId = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        schoolId,
        studentFeeId: input.studentFeeId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        receivedById: actorUserId,
        paidAt: input.paidAt ?? new Date(),
      },
    });

    await tx.studentFee.update({ where: { id: input.studentFeeId }, data: { amountPaid: newAmountPaid, status: deriveStatus(studentFee.amountDue, newAmountPaid) } });

    // A per-school sequence, human-facing — good enough for v1's single-writer-at-a-time
    // accountant workflow; a high-concurrency school would want a dedicated counter row.
    const receiptCount = await tx.receipt.count({ where: { schoolId } });
    const receiptNo = `RC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(6, "0")}`;
    await tx.receipt.create({ data: { schoolId, paymentId: created.id, receiptNo } });

    return created.id;
  });

  await writeAuditLog({ actorUserId, action: "payment.record", targetSchoolId: schoolId, entity: "Payment", entityId: paymentId, diff: { amount: input.amount, studentFeeId: input.studentFeeId } });

  return getPayment(paymentId);
}

export async function listPayments(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.PaymentWhereInput = {};
  if (typeof query.studentFeeId === "string") where.studentFeeId = query.studentFeeId;
  if (typeof query.studentId === "string") where.studentFee = { studentId: query.studentId };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({ where, include: DETAIL_INCLUDE, orderBy: { paidAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.payment.count({ where }),
  ]);

  return { payments: rows.map(toDetails), meta: paginationMeta(total, page) };
}

export async function getPayment(paymentId: string): Promise<PaymentWithDetails> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: DETAIL_INCLUDE });
  if (!payment) throw new NotFoundError("Payment not found");
  return toDetails(payment);
}
