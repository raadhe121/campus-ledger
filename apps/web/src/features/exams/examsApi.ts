import type { ApiSuccess, Exam } from "@campus-ledger/shared-types";
import type { CreateExamInput, UpdateExamInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// School Admin's "Manage" scope on exams (§07) — Teacher/Student's own
// slice lives in features/me/meApi.ts.
export const examsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listExams: builder.query<Paginated<Exam>, { academicYearId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/exams", params: params ?? undefined }),
      providesTags: (result) =>
        result ? [...result.data.map((e) => ({ type: "Exam" as const, id: e.id })), { type: "Exam", id: "LIST" }] : [{ type: "Exam", id: "LIST" }],
    }),
    getExam: builder.query<ApiSuccess<Exam>, string>({
      query: (examId) => `/exams/${examId}`,
      providesTags: (_r, _e, examId) => [{ type: "Exam", id: examId }],
    }),
    createExam: builder.mutation<ApiSuccess<Exam>, CreateExamInput>({
      query: (body) => ({ url: "/exams", method: "POST", body }),
      invalidatesTags: [{ type: "Exam", id: "LIST" }],
    }),
    updateExam: builder.mutation<ApiSuccess<Exam>, { examId: string; body: UpdateExamInput }>({
      query: ({ examId, body }) => ({ url: `/exams/${examId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { examId }) => [{ type: "Exam", id: examId }, { type: "Exam", id: "LIST" }],
    }),
    deleteExam: builder.mutation<void, string>({
      query: (examId) => ({ url: `/exams/${examId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Exam", id: "LIST" }],
    }),
  }),
});

export const { useListExamsQuery, useGetExamQuery, useCreateExamMutation, useUpdateExamMutation, useDeleteExamMutation } = examsApi;
