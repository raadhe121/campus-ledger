import type { ApiSuccess, PublicUser, School, SchoolStatus } from "@campus-ledger/shared-types";
import type { CreateSchoolAdminInput, CreateSchoolInput, SchoolStatusInput, UpdateSchoolInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const schoolsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listSchools: builder.query<Paginated<School>, { page?: number; limit?: number; status?: SchoolStatus } | void>({
      query: (params) => ({ url: "/super-admin/schools", params: params ?? undefined }),
      providesTags: (result) =>
        result ? [...result.data.map((s) => ({ type: "School" as const, id: s.id })), { type: "School", id: "LIST" }] : [{ type: "School", id: "LIST" }],
    }),
    getSchool: builder.query<ApiSuccess<School>, string>({
      query: (schoolId) => `/super-admin/schools/${schoolId}`,
      providesTags: (_r, _e, schoolId) => [{ type: "School", id: schoolId }],
    }),
    createSchool: builder.mutation<ApiSuccess<School>, CreateSchoolInput>({
      query: (body) => ({ url: "/super-admin/schools", method: "POST", body }),
      invalidatesTags: [{ type: "School", id: "LIST" }],
    }),
    updateSchool: builder.mutation<ApiSuccess<School>, { schoolId: string; body: UpdateSchoolInput }>({
      query: ({ schoolId, body }) => ({ url: `/super-admin/schools/${schoolId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { schoolId }) => [{ type: "School", id: schoolId }, { type: "School", id: "LIST" }],
    }),
    setSchoolStatus: builder.mutation<ApiSuccess<School>, { schoolId: string; body: SchoolStatusInput }>({
      query: ({ schoolId, body }) => ({ url: `/super-admin/schools/${schoolId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { schoolId }) => [{ type: "School", id: schoolId }, { type: "School", id: "LIST" }],
    }),
    listSchoolAdmins: builder.query<Paginated<PublicUser>, string>({
      query: (schoolId) => `/super-admin/schools/${schoolId}/admins`,
      providesTags: (_r, _e, schoolId) => [{ type: "SchoolAdmins", id: schoolId }],
    }),
    createSchoolAdmin: builder.mutation<ApiSuccess<{ user: PublicUser; tempPassword: string }>, { schoolId: string; body: CreateSchoolAdminInput }>({
      query: ({ schoolId, body }) => ({ url: `/super-admin/schools/${schoolId}/admins`, method: "POST", body }),
      invalidatesTags: (_r, _e, { schoolId }) => [{ type: "SchoolAdmins", id: schoolId }],
    }),
  }),
});

export const {
  useListSchoolsQuery,
  useGetSchoolQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useSetSchoolStatusMutation,
  useListSchoolAdminsQuery,
  useCreateSchoolAdminMutation,
} = schoolsApi;
