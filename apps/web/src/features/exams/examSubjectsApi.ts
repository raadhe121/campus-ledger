import type { ApiSuccess, ExamSubjectWithDetails, MarksRosterEntry, Result } from "@campus-ledger/shared-types";
import type { CreateExamSubjectInput, UpdateExamSubjectInput, EnterMarksInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// Scheduling (create/update/delete, broad browse) is School Admin's
// "Manage" scope (§07). Marks entry (roster + enter) is shared with
// Teacher's "CRU (own subject)" — ownership is enforced server-side, so
// the same two endpoints serve both roles.
export const examSubjectsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listExamSubjects: builder.query<Paginated<ExamSubjectWithDetails>, { examId?: string; sectionId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/exam-subjects", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "ExamSubject" as const, id: s.id })), { type: "ExamSubject", id: "LIST" }]
          : [{ type: "ExamSubject", id: "LIST" }],
    }),
    getExamSubject: builder.query<ApiSuccess<ExamSubjectWithDetails>, string>({
      query: (examSubjectId) => `/exam-subjects/${examSubjectId}`,
      providesTags: (_r, _e, examSubjectId) => [{ type: "ExamSubject", id: examSubjectId }],
    }),
    createExamSubject: builder.mutation<ApiSuccess<ExamSubjectWithDetails>, CreateExamSubjectInput>({
      query: (body) => ({ url: "/exam-subjects", method: "POST", body }),
      invalidatesTags: [{ type: "ExamSubject", id: "LIST" }],
    }),
    updateExamSubject: builder.mutation<ApiSuccess<ExamSubjectWithDetails>, { examSubjectId: string; body: UpdateExamSubjectInput }>({
      query: ({ examSubjectId, body }) => ({ url: `/exam-subjects/${examSubjectId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { examSubjectId }) => [{ type: "ExamSubject", id: examSubjectId }, { type: "ExamSubject", id: "LIST" }],
    }),
    deleteExamSubject: builder.mutation<void, string>({
      query: (examSubjectId) => ({ url: `/exam-subjects/${examSubjectId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "ExamSubject", id: "LIST" }],
    }),
    getMarksRoster: builder.query<ApiSuccess<MarksRosterEntry[]>, string>({
      query: (examSubjectId) => `/exam-subjects/${examSubjectId}/roster`,
      providesTags: (_r, _e, examSubjectId) => [{ type: "MarksRoster", id: examSubjectId }],
    }),
    enterMarks: builder.mutation<ApiSuccess<Result[]>, { examSubjectId: string; body: EnterMarksInput }>({
      query: ({ examSubjectId, body }) => ({ url: `/exam-subjects/${examSubjectId}/marks`, method: "POST", body }),
      invalidatesTags: (_r, _e, { examSubjectId }) => [{ type: "MarksRoster", id: examSubjectId }, "MyResults"],
    }),
  }),
});

export const {
  useListExamSubjectsQuery,
  useGetExamSubjectQuery,
  useCreateExamSubjectMutation,
  useUpdateExamSubjectMutation,
  useDeleteExamSubjectMutation,
  useGetMarksRosterQuery,
  useEnterMarksMutation,
} = examSubjectsApi;
