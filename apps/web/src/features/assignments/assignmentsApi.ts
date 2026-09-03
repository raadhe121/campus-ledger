import type { ApiSuccess, AssignmentWithDetails, SubmissionWithStudent, Submission } from "@campus-ledger/shared-types";
import type { CreateAssignmentInput, UpdateAssignmentInput, GradeSubmissionInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// §07 gives School Admin only "R" here — every mutating endpoint is
// Teacher-only, and the server force-filters listAssignments to the
// caller's own for a TEACHER regardless of query. Student's read + submit
// path is entirely under features/me/meApi.ts.
export const assignmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAssignments: builder.query<Paginated<AssignmentWithDetails>, { sectionId?: string; subjectId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/assignments", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((a) => ({ type: "Assignment" as const, id: a.id })), { type: "Assignment", id: "LIST" }]
          : [{ type: "Assignment", id: "LIST" }],
    }),
    createAssignment: builder.mutation<ApiSuccess<AssignmentWithDetails>, CreateAssignmentInput>({
      query: (body) => ({ url: "/assignments", method: "POST", body }),
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),
    updateAssignment: builder.mutation<ApiSuccess<AssignmentWithDetails>, { assignmentId: string; body: UpdateAssignmentInput }>({
      query: ({ assignmentId, body }) => ({ url: `/assignments/${assignmentId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { assignmentId }) => [{ type: "Assignment", id: assignmentId }, { type: "Assignment", id: "LIST" }],
    }),
    deleteAssignment: builder.mutation<void, string>({
      query: (assignmentId) => ({ url: `/assignments/${assignmentId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),
    listSubmissions: builder.query<ApiSuccess<SubmissionWithStudent[]>, string>({
      query: (assignmentId) => `/assignments/${assignmentId}/submissions`,
      providesTags: (_r, _e, assignmentId) => [{ type: "Submissions", id: assignmentId }],
    }),
    gradeSubmission: builder.mutation<ApiSuccess<Submission>, { submissionId: string; assignmentId: string; body: GradeSubmissionInput }>({
      query: ({ submissionId, body }) => ({ url: `/assignments/submissions/${submissionId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { assignmentId }) => [{ type: "Submissions", id: assignmentId }],
    }),
  }),
});

export const {
  useListAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useListSubmissionsQuery,
  useGradeSubmissionMutation,
} = assignmentsApi;
