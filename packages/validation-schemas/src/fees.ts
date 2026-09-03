import { z } from "zod";

export const createFeeStructureSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  name: z.string().min(2).max(100),
  frequency: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"]).default("ONE_TIME"),
});
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;

export const updateFeeStructureSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  frequency: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"]).optional(),
});
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;

export const createFeeItemSchema = z.object({
  label: z.string().min(2).max(100),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});
export type CreateFeeItemInput = z.infer<typeof createFeeItemSchema>;

export const updateFeeItemSchema = z.object({
  label: z.string().min(2).max(100).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateFeeItemInput = z.infer<typeof updateFeeItemSchema>;

// A one-off charge for a single student — a late enrollment joining after
// a FeeItem's bulk "generate" already ran, or a fee that only applies to
// one student. `amountDue` defaults to the FeeItem's own amount when
// omitted; passing it is how a concession/waiver gets recorded.
export const assignStudentFeeSchema = z.object({
  studentId: z.string().min(1),
  feeItemId: z.string().min(1),
  amountDue: z.number().nonnegative().optional(),
});
export type AssignStudentFeeInput = z.infer<typeof assignStudentFeeSchema>;

export const updateStudentFeeSchema = z.object({
  amountDue: z.number().nonnegative(),
});
export type UpdateStudentFeeInput = z.infer<typeof updateStudentFeeSchema>;

export const recordPaymentSchema = z.object({
  studentFeeId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "OTHER"]),
  reference: z.string().max(100).optional(),
  paidAt: z.coerce.date().optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const createExpenseSchema = z.object({
  category: z.string().min(2).max(100),
  amount: z.number().positive(),
  vendor: z.string().max(150).optional(),
  description: z.string().max(2000).optional(),
  date: z.coerce.date(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  category: z.string().min(2).max(100).optional(),
  amount: z.number().positive().optional(),
  vendor: z.string().max(150).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  date: z.coerce.date().optional(),
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
