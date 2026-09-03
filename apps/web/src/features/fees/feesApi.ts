import type { ApiSuccess, FeeStructureWithDetails, FeeItem, StudentFeeWithDetails, PaymentWithDetails, ExpenseWithDetails } from "@campus-ledger/shared-types";
import type {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  CreateFeeItemInput,
  UpdateFeeItemInput,
  AssignStudentFeeInput,
  UpdateStudentFeeInput,
  RecordPaymentInput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// §07: SCHOOL_ADMIN and ACCOUNTANT share the same "Manage" scope over
// fees/payments — unlike every earlier module, there's no role split to
// bake into these hooks. Expenses narrows for SCHOOL_ADMIN to "R" only,
// enforced server-side; ExpensesPage just hides the write UI for them.
export const feesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listFeeStructures: builder.query<Paginated<FeeStructureWithDetails>, { academicYearId?: string; classId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/fee-structures", params: params ?? undefined }),
      providesTags: (result) =>
        result ? [...result.data.map((s) => ({ type: "FeeStructure" as const, id: s.id })), { type: "FeeStructure", id: "LIST" }] : [{ type: "FeeStructure", id: "LIST" }],
    }),
    createFeeStructure: builder.mutation<ApiSuccess<FeeStructureWithDetails>, CreateFeeStructureInput>({
      query: (body) => ({ url: "/fee-structures", method: "POST", body }),
      invalidatesTags: [{ type: "FeeStructure", id: "LIST" }],
    }),
    updateFeeStructure: builder.mutation<ApiSuccess<FeeStructureWithDetails>, { feeStructureId: string; body: UpdateFeeStructureInput }>({
      query: ({ feeStructureId, body }) => ({ url: `/fee-structures/${feeStructureId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { feeStructureId }) => [{ type: "FeeStructure", id: feeStructureId }, { type: "FeeStructure", id: "LIST" }],
    }),
    deleteFeeStructure: builder.mutation<void, string>({
      query: (feeStructureId) => ({ url: `/fee-structures/${feeStructureId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "FeeStructure", id: "LIST" }],
    }),
    createFeeItem: builder.mutation<ApiSuccess<FeeItem>, { feeStructureId: string; body: CreateFeeItemInput }>({
      query: ({ feeStructureId, body }) => ({ url: `/fee-structures/${feeStructureId}/items`, method: "POST", body }),
      invalidatesTags: (_r, _e, { feeStructureId }) => [{ type: "FeeStructure", id: feeStructureId }],
    }),
    updateFeeItem: builder.mutation<ApiSuccess<FeeItem>, { feeItemId: string; feeStructureId: string; body: UpdateFeeItemInput }>({
      query: ({ feeItemId, body }) => ({ url: `/fee-structures/items/${feeItemId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { feeStructureId }) => [{ type: "FeeStructure", id: feeStructureId }],
    }),
    deleteFeeItem: builder.mutation<void, { feeItemId: string; feeStructureId: string }>({
      query: ({ feeItemId }) => ({ url: `/fee-structures/items/${feeItemId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { feeStructureId }) => [{ type: "FeeStructure", id: feeStructureId }],
    }),
    generateStudentFees: builder.mutation<ApiSuccess<{ created: number; alreadyAssigned: number }>, { feeItemId: string; feeStructureId: string }>({
      query: ({ feeItemId }) => ({ url: `/fee-structures/items/${feeItemId}/generate`, method: "POST" }),
      invalidatesTags: [{ type: "StudentFee", id: "LIST" }],
    }),

    listStudentFees: builder.query<Paginated<StudentFeeWithDetails>, { studentId?: string; feeItemId?: string; status?: string; limit?: number } | void>({
      query: (params) => ({ url: "/student-fees", params: params ?? undefined }),
      providesTags: (result) =>
        result ? [...result.data.map((f) => ({ type: "StudentFee" as const, id: f.id })), { type: "StudentFee", id: "LIST" }] : [{ type: "StudentFee", id: "LIST" }],
    }),
    getStudentFee: builder.query<ApiSuccess<StudentFeeWithDetails>, string>({
      query: (studentFeeId) => `/student-fees/${studentFeeId}`,
      providesTags: (_r, _e, studentFeeId) => [{ type: "StudentFee", id: studentFeeId }],
    }),
    assignStudentFee: builder.mutation<ApiSuccess<StudentFeeWithDetails>, AssignStudentFeeInput>({
      query: (body) => ({ url: "/student-fees", method: "POST", body }),
      invalidatesTags: [{ type: "StudentFee", id: "LIST" }],
    }),
    updateStudentFee: builder.mutation<ApiSuccess<StudentFeeWithDetails>, { studentFeeId: string; body: UpdateStudentFeeInput }>({
      query: ({ studentFeeId, body }) => ({ url: `/student-fees/${studentFeeId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { studentFeeId }) => [{ type: "StudentFee", id: studentFeeId }, { type: "StudentFee", id: "LIST" }],
    }),
    deleteStudentFee: builder.mutation<void, string>({
      query: (studentFeeId) => ({ url: `/student-fees/${studentFeeId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "StudentFee", id: "LIST" }],
    }),

    listPayments: builder.query<Paginated<PaymentWithDetails>, { studentFeeId?: string; studentId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/payments", params: params ?? undefined }),
      providesTags: (result) => (result ? [...result.data.map((p) => ({ type: "Payment" as const, id: p.id })), { type: "Payment", id: "LIST" }] : [{ type: "Payment", id: "LIST" }]),
    }),
    // A retried click reuses the same idempotencyKey (generated once per
    // form open, not per click) — §08's convention this route actually
    // enforces server-side, not just a client-side debounce.
    recordPayment: builder.mutation<ApiSuccess<PaymentWithDetails>, { body: RecordPaymentInput; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/payments", method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
      invalidatesTags: (result) =>
        result ? [{ type: "StudentFee", id: result.data.studentFeeId }, { type: "StudentFee", id: "LIST" }, { type: "Payment", id: "LIST" }, "MyFees"] : [{ type: "Payment", id: "LIST" }],
    }),

    listExpenses: builder.query<Paginated<ExpenseWithDetails>, { category?: string; limit?: number } | void>({
      query: (params) => ({ url: "/expenses", params: params ?? undefined }),
      providesTags: (result) => (result ? [...result.data.map((e) => ({ type: "Expense" as const, id: e.id })), { type: "Expense", id: "LIST" }] : [{ type: "Expense", id: "LIST" }]),
    }),
    createExpense: builder.mutation<ApiSuccess<ExpenseWithDetails>, CreateExpenseInput>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
    updateExpense: builder.mutation<ApiSuccess<ExpenseWithDetails>, { expenseId: string; body: UpdateExpenseInput }>({
      query: ({ expenseId, body }) => ({ url: `/expenses/${expenseId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { expenseId }) => [{ type: "Expense", id: expenseId }, { type: "Expense", id: "LIST" }],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (expenseId) => ({ url: `/expenses/${expenseId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
  }),
});

export const {
  useListFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useCreateFeeItemMutation,
  useUpdateFeeItemMutation,
  useDeleteFeeItemMutation,
  useGenerateStudentFeesMutation,
  useListStudentFeesQuery,
  useGetStudentFeeQuery,
  useAssignStudentFeeMutation,
  useUpdateStudentFeeMutation,
  useDeleteStudentFeeMutation,
  useListPaymentsQuery,
  useRecordPaymentMutation,
  useListExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = feesApi;
