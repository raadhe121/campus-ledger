import type { ApiSuccess, EnrollmentWithDetails } from "@campus-ledger/shared-types";
import type { CreateEnrollmentInput, UpdateEnrollmentInput, TransferEnrollmentInput, PromoteEnrollmentsInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// The yearly hinge (architecture §04) — a student doesn't belong to a
// Section directly, each academic year produces a fresh Enrollment row.
// No delete endpoint: withdrawing a student is a status transition, not a
// row removal (enrollment.routes.ts).
export const enrollmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listEnrollments: builder.query<
      Paginated<EnrollmentWithDetails>,
      { sectionId?: string; academicYearId?: string; studentId?: string; classId?: string; status?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/enrollments", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((e) => ({ type: "Enrollment" as const, id: e.id })), { type: "Enrollment", id: "LIST" }]
          : [{ type: "Enrollment", id: "LIST" }],
    }),
    listCurrentEnrollments: builder.query<Paginated<EnrollmentWithDetails>, { academicYearId?: string; classId?: string; sectionId?: string } | void>({
      query: (params) => ({ url: "/enrollments/current", params: params ?? undefined }),
      providesTags: [{ type: "Enrollment", id: "LIST" }],
    }),
    getStudentHistory: builder.query<ApiSuccess<EnrollmentWithDetails[]>, string>({
      query: (studentId) => `/enrollments/student/${studentId}/history`,
      providesTags: (_r, _e, id) => [{ type: "Enrollment", id }, { type: "Enrollment", id: "HISTORY" }],
    }),
    createEnrollment: builder.mutation<ApiSuccess<EnrollmentWithDetails>, CreateEnrollmentInput>({
      query: (body) => ({ url: "/enrollments", method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "LIST" }],
    }),
    updateEnrollment: builder.mutation<ApiSuccess<EnrollmentWithDetails>, { enrollmentId: string; body: UpdateEnrollmentInput }>({
      query: ({ enrollmentId, body }) => ({ url: `/enrollments/${enrollmentId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { enrollmentId }) => [{ type: "Enrollment", id: enrollmentId }, { type: "Enrollment", id: "LIST" }],
    }),
    transferEnrollment: builder.mutation<ApiSuccess<EnrollmentWithDetails>, { enrollmentId: string; body: TransferEnrollmentInput }>({
      query: ({ enrollmentId, body }) => ({ url: `/enrollments/${enrollmentId}/transfer`, method: "POST", body }),
      invalidatesTags: (_r, _e, { enrollmentId }) => [{ type: "Enrollment", id: enrollmentId }, { type: "Enrollment", id: "LIST" }],
    }),
    promoteEnrollments: builder.mutation<ApiSuccess<EnrollmentWithDetails[]>, PromoteEnrollmentsInput>({
      query: (body) => ({ url: "/enrollments/promote", method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "LIST" }],
    }),
  }),
});

export const {
  useListEnrollmentsQuery,
  useListCurrentEnrollmentsQuery,
  useGetStudentHistoryQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useTransferEnrollmentMutation,
  usePromoteEnrollmentsMutation,
} = enrollmentApi;
