import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "@campus-ledger/validation-schemas";
import type { ExpenseWithDetails } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = { recordedBy: true } as const;

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: ExpenseRow): ExpenseWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    category: row.category,
    amount: row.amount,
    vendor: row.vendor,
    description: row.description,
    date: row.date.toISOString(),
    recordedById: row.recordedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    recordedBy: { id: row.recordedBy.id, firstName: row.recordedBy.firstName, lastName: row.recordedBy.lastName },
  };
}

export async function createExpense(input: CreateExpenseInput, actorUserId: string, schoolId: string): Promise<ExpenseWithDetails> {
  const expense = await prisma.expense.create({ data: { ...input, schoolId, recordedById: actorUserId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "expense.create", targetSchoolId: schoolId, entity: "Expense", entityId: expense.id });

  return toDetails(expense);
}

export async function listExpenses(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.ExpenseWhereInput = {};
  if (typeof query.category === "string") where.category = query.category;

  const [rows, total] = await Promise.all([
    prisma.expense.findMany({ where, include: DETAIL_INCLUDE, orderBy: { date: "desc" }, skip: page.skip, take: page.limit }),
    prisma.expense.count({ where }),
  ]);

  return { expenses: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findExpenseOrThrow(expenseId: string) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: DETAIL_INCLUDE });
  if (!expense) throw new NotFoundError("Expense not found");
  return expense;
}

export async function getExpense(expenseId: string): Promise<ExpenseWithDetails> {
  return toDetails(await findExpenseOrThrow(expenseId));
}

export async function updateExpense(expenseId: string, input: UpdateExpenseInput, actorUserId: string, schoolId: string): Promise<ExpenseWithDetails> {
  await findExpenseOrThrow(expenseId);

  const expense = await prisma.expense.update({ where: { id: expenseId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "expense.update", targetSchoolId: schoolId, entity: "Expense", entityId: expenseId, diff: input });

  return toDetails(expense);
}

export async function deleteExpense(expenseId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findExpenseOrThrow(expenseId);
  await prisma.expense.delete({ where: { id: expenseId } });

  await writeAuditLog({ actorUserId, action: "expense.delete", targetSchoolId: schoolId, entity: "Expense", entityId: expenseId });
}
