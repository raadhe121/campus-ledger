import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  CreateFeeItemInput,
  UpdateFeeItemInput,
} from "@campus-ledger/validation-schemas";
import type { FeeStructureWithDetails, FeeItem } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  academicYear: true,
  class: true,
  items: { orderBy: { dueDate: "asc" } },
} as const;

type FeeStructureRow = Prisma.FeeStructureGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toItem(row: { id: string; schoolId: string; feeStructureId: string; label: string; amount: number; dueDate: Date; createdAt: Date; updatedAt: Date }): FeeItem {
  return { ...row, dueDate: row.dueDate.toISOString(), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

function toDetails(row: FeeStructureRow): FeeStructureWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    academicYearId: row.academicYearId,
    classId: row.classId,
    name: row.name,
    frequency: row.frequency,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    academicYear: { id: row.academicYear.id, label: row.academicYear.label },
    class: { id: row.class.id, name: row.class.name },
    items: row.items.map(toItem),
  };
}

export async function createFeeStructure(input: CreateFeeStructureInput, actorUserId: string, schoolId: string): Promise<FeeStructureWithDetails> {
  const academicYear = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!academicYear) throw new NotFoundError("Academic year not found");

  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls) throw new NotFoundError("Class not found");

  const existing = await prisma.feeStructure.findFirst({ where: { academicYearId: input.academicYearId, classId: input.classId, name: input.name } });
  if (existing) throw new ConflictError("A fee structure with this name already exists for this class and year");

  const feeStructure = await prisma.feeStructure.create({ data: { ...input, schoolId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "fee_structure.create", targetSchoolId: schoolId, entity: "FeeStructure", entityId: feeStructure.id });

  return toDetails(feeStructure);
}

export async function listFeeStructures(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.FeeStructureWhereInput = {};
  if (typeof query.academicYearId === "string") where.academicYearId = query.academicYearId;
  if (typeof query.classId === "string") where.classId = query.classId;

  const [rows, total] = await Promise.all([
    prisma.feeStructure.findMany({ where, include: DETAIL_INCLUDE, orderBy: { createdAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.feeStructure.count({ where }),
  ]);

  return { feeStructures: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findFeeStructureOrThrow(feeStructureId: string) {
  const feeStructure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId }, include: DETAIL_INCLUDE });
  if (!feeStructure) throw new NotFoundError("Fee structure not found");
  return feeStructure;
}

export async function getFeeStructure(feeStructureId: string): Promise<FeeStructureWithDetails> {
  return toDetails(await findFeeStructureOrThrow(feeStructureId));
}

export async function updateFeeStructure(feeStructureId: string, input: UpdateFeeStructureInput, actorUserId: string, schoolId: string): Promise<FeeStructureWithDetails> {
  await findFeeStructureOrThrow(feeStructureId);

  const feeStructure = await prisma.feeStructure.update({ where: { id: feeStructureId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "fee_structure.update", targetSchoolId: schoolId, entity: "FeeStructure", entityId: feeStructureId, diff: input });

  return toDetails(feeStructure);
}

export async function deleteFeeStructure(feeStructureId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findFeeStructureOrThrow(feeStructureId);

  const chargeCount = await prisma.studentFee.count({ where: { feeItem: { feeStructureId } } });
  if (chargeCount > 0) throw new ConflictError("Cannot delete a fee structure whose items already have student charges generated against them");

  await prisma.feeStructure.delete({ where: { id: feeStructureId } }); // cascades its (now guaranteed charge-free) FeeItems

  await writeAuditLog({ actorUserId, action: "fee_structure.delete", targetSchoolId: schoolId, entity: "FeeStructure", entityId: feeStructureId });
}

export async function createFeeItem(feeStructureId: string, input: CreateFeeItemInput, actorUserId: string, schoolId: string): Promise<FeeItem> {
  const feeStructure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
  if (!feeStructure) throw new NotFoundError("Fee structure not found");

  const item = await prisma.feeItem.create({ data: { ...input, feeStructureId, schoolId } });

  await writeAuditLog({ actorUserId, action: "fee_item.create", targetSchoolId: schoolId, entity: "FeeItem", entityId: item.id });

  return toItem(item);
}

async function findFeeItemOrThrow(feeItemId: string) {
  const item = await prisma.feeItem.findUnique({ where: { id: feeItemId } });
  if (!item) throw new NotFoundError("Fee item not found");
  return item;
}

export async function updateFeeItem(feeItemId: string, input: UpdateFeeItemInput, actorUserId: string, schoolId: string): Promise<FeeItem> {
  await findFeeItemOrThrow(feeItemId);

  const item = await prisma.feeItem.update({ where: { id: feeItemId }, data: input });

  await writeAuditLog({ actorUserId, action: "fee_item.update", targetSchoolId: schoolId, entity: "FeeItem", entityId: feeItemId, diff: input });

  return toItem(item);
}

export async function deleteFeeItem(feeItemId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findFeeItemOrThrow(feeItemId);

  const chargeCount = await prisma.studentFee.count({ where: { feeItemId } });
  if (chargeCount > 0) throw new ConflictError("Cannot delete a fee item that already has student charges generated against it");

  await prisma.feeItem.delete({ where: { id: feeItemId } });

  await writeAuditLog({ actorUserId, action: "fee_item.delete", targetSchoolId: schoolId, entity: "FeeItem", entityId: feeItemId });
}

/**
 * The Accountant's bulk-charge action: one StudentFee per student actively
 * enrolled (this FeeItem's structure's academic year) in any section under
 * this FeeItem's structure's class — skipping students who already have a
 * charge for this item, so running it twice (or after a late admission) is
 * safe rather than duplicating or resetting anyone's amountPaid.
 */
export async function generateStudentFees(feeItemId: string, actorUserId: string, schoolId: string): Promise<{ created: number; alreadyAssigned: number }> {
  const feeItem = await prisma.feeItem.findUnique({ where: { id: feeItemId }, include: { feeStructure: true } });
  if (!feeItem) throw new NotFoundError("Fee item not found");

  const enrollments = await prisma.enrollment.findMany({
    where: { academicYearId: feeItem.feeStructure.academicYearId, status: "ACTIVE", section: { classId: feeItem.feeStructure.classId } },
    select: { studentId: true },
  });
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

  const existing = await prisma.studentFee.findMany({ where: { feeItemId, studentId: { in: studentIds } }, select: { studentId: true } });
  const existingIds = new Set(existing.map((e) => e.studentId));
  const toCreate = studentIds.filter((id) => !existingIds.has(id));

  if (toCreate.length > 0) {
    await prisma.studentFee.createMany({ data: toCreate.map((studentId) => ({ schoolId, studentId, feeItemId, amountDue: feeItem.amount })) });
  }

  await writeAuditLog({ actorUserId, action: "fee_item.generate", targetSchoolId: schoolId, entity: "FeeItem", entityId: feeItemId, diff: { created: toCreate.length } });

  return { created: toCreate.length, alreadyAssigned: existingIds.size };
}
