import type { ApiSuccess, StaffWithProfile, StudentWithProfile, PublicUser, ParentStudentLinkWithStudent, EnrollmentWithDetails } from "@campus-ledger/shared-types";
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
  CreateStudentInput,
  UpdateStudentInput,
  CreateParentInput,
  UpdateParentInput,
  CreateStaffInput,
  UpdateStaffInput,
  PersonStatusInput,
  LinkParentStudentInput,
  EnrollStudentInput,
  AssignClassInput,
  TransferStudentInput,
} from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// Teachers, Students, Parents and Staff — the "teacher/student/parent/staff
// CRUD + enrollment" half of Phase 02 (architecture §11). Every create
// endpoint provisions a pending User and returns a one-time tempPassword
// (§05) rather than an admin ever setting a first password themselves.

interface WithTempPassword<T> {
  data: T & { tempPassword: string };
}

export const peopleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Teachers (StaffWithProfile, role fixed server-side) ----
    listTeachers: builder.query<Paginated<StaffWithProfile>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/teachers", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((t) => ({ type: "Teacher" as const, id: t.user.id })), { type: "Teacher", id: "LIST" }]
          : [{ type: "Teacher", id: "LIST" }],
    }),
    createTeacher: builder.mutation<WithTempPassword<StaffWithProfile>, CreateTeacherInput>({
      query: (body) => ({ url: "/teachers", method: "POST", body }),
      invalidatesTags: [{ type: "Teacher", id: "LIST" }],
    }),
    updateTeacher: builder.mutation<ApiSuccess<StaffWithProfile>, { userId: string; body: UpdateTeacherInput }>({
      query: ({ userId, body }) => ({ url: `/teachers/${userId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Teacher", id: userId }, { type: "Teacher", id: "LIST" }],
    }),
    setTeacherStatus: builder.mutation<ApiSuccess<StaffWithProfile>, { userId: string; body: PersonStatusInput }>({
      query: ({ userId, body }) => ({ url: `/teachers/${userId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Teacher", id: userId }, { type: "Teacher", id: "LIST" }],
    }),

    // ---- Students (StudentWithProfile) ----
    listStudents: builder.query<Paginated<StudentWithProfile>, { page?: number; limit?: number; search?: string } | void>({
      query: (params) => ({ url: "/students", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "Student" as const, id: s.user.id })), { type: "Student", id: "LIST" }]
          : [{ type: "Student", id: "LIST" }],
    }),
    listCurrentStudents: builder.query<
      { data: StudentWithProfile[]; enrollments: EnrollmentWithDetails[]; meta: Paginated<unknown>["meta"] },
      { academicYearId?: string; classId?: string; sectionId?: string; status?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/students/current", params: params ?? undefined }),
      providesTags: [{ type: "Student", id: "CURRENT" }, { type: "Enrollment", id: "LIST" }],
    }),
    getStudentHistory: builder.query<ApiSuccess<{ student: StudentWithProfile; history: EnrollmentWithDetails[]; currentEnrollment: EnrollmentWithDetails | null }>, string>({
      query: (userId) => `/students/${userId}/history`,
      providesTags: (_r, _e, id) => [{ type: "Student", id }, { type: "Enrollment", id: "HISTORY" }],
    }),
    createStudent: builder.mutation<WithTempPassword<StudentWithProfile>, CreateStudentInput>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),
    updateStudent: builder.mutation<ApiSuccess<StudentWithProfile>, { userId: string; body: UpdateStudentInput }>({
      query: ({ userId, body }) => ({ url: `/students/${userId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Student", id: userId }, { type: "Student", id: "LIST" }],
    }),
    setStudentStatus: builder.mutation<ApiSuccess<StudentWithProfile>, { userId: string; body: PersonStatusInput }>({
      query: ({ userId, body }) => ({ url: `/students/${userId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Student", id: userId }, { type: "Student", id: "LIST" }],
    }),
    enrollStudent: builder.mutation<ApiSuccess<EnrollmentWithDetails>, { userId: string; body: EnrollStudentInput }>({
      query: ({ userId, body }) => ({ url: `/students/${userId}/enroll`, method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "LIST" }, { type: "Student", id: "LIST" }],
    }),
    assignClass: builder.mutation<ApiSuccess<EnrollmentWithDetails>, { userId: string; body: AssignClassInput }>({
      query: ({ userId, body }) => ({ url: `/students/${userId}/assign-class`, method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "LIST" }],
    }),
    transferStudent: builder.mutation<ApiSuccess<EnrollmentWithDetails>, { userId: string; body: TransferStudentInput }>({
      query: ({ userId, body }) => ({ url: `/students/${userId}/transfer`, method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "LIST" }, { type: "Student", id: "CURRENT" }],
    }),

    // ---- Parents (plain PublicUser + ParentStudent links — no profile table, §03) ----
    listParents: builder.query<Paginated<PublicUser>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/parents", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((p) => ({ type: "Parent" as const, id: p.id })), { type: "Parent", id: "LIST" }]
          : [{ type: "Parent", id: "LIST" }],
    }),
    createParent: builder.mutation<WithTempPassword<{ user: PublicUser }>, CreateParentInput>({
      query: (body) => ({ url: "/parents", method: "POST", body }),
      invalidatesTags: [{ type: "Parent", id: "LIST" }],
    }),
    updateParent: builder.mutation<ApiSuccess<PublicUser>, { userId: string; body: UpdateParentInput }>({
      query: ({ userId, body }) => ({ url: `/parents/${userId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Parent", id: userId }, { type: "Parent", id: "LIST" }],
    }),
    setParentStatus: builder.mutation<ApiSuccess<PublicUser>, { userId: string; body: PersonStatusInput }>({
      query: ({ userId, body }) => ({ url: `/parents/${userId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Parent", id: userId }, { type: "Parent", id: "LIST" }],
    }),
    listChildren: builder.query<ApiSuccess<ParentStudentLinkWithStudent[]>, string>({
      query: (parentId) => `/parents/${parentId}/children`,
      providesTags: (_r, _e, parentId) => [{ type: "ParentChildren", id: parentId }],
    }),
    linkChild: builder.mutation<ApiSuccess<ParentStudentLinkWithStudent>, { parentId: string; body: LinkParentStudentInput }>({
      query: ({ parentId, body }) => ({ url: `/parents/${parentId}/children`, method: "POST", body }),
      invalidatesTags: (_r, _e, { parentId }) => [{ type: "ParentChildren", id: parentId }],
    }),
    unlinkChild: builder.mutation<void, { parentId: string; linkId: string }>({
      query: ({ parentId, linkId }) => ({ url: `/parents/${parentId}/children/${linkId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { parentId }) => [{ type: "ParentChildren", id: parentId }],
    }),

    // ---- Staff (STAFF + ACCOUNTANT, StaffWithProfile) ----
    listStaff: builder.query<Paginated<StaffWithProfile>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/staff", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "Staff" as const, id: s.user.id })), { type: "Staff", id: "LIST" }]
          : [{ type: "Staff", id: "LIST" }],
    }),
    createStaff: builder.mutation<WithTempPassword<StaffWithProfile>, CreateStaffInput>({
      query: (body) => ({ url: "/staff", method: "POST", body }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),
    updateStaff: builder.mutation<ApiSuccess<StaffWithProfile>, { userId: string; body: UpdateStaffInput }>({
      query: ({ userId, body }) => ({ url: `/staff/${userId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Staff", id: userId }, { type: "Staff", id: "LIST" }],
    }),
    setStaffStatus: builder.mutation<ApiSuccess<StaffWithProfile>, { userId: string; body: PersonStatusInput }>({
      query: ({ userId, body }) => ({ url: `/staff/${userId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: "Staff", id: userId }, { type: "Staff", id: "LIST" }],
    }),
  }),
});

export const {
  useListTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useSetTeacherStatusMutation,
  useListStudentsQuery,
  useListCurrentStudentsQuery,
  useGetStudentHistoryQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useSetStudentStatusMutation,
  useEnrollStudentMutation,
  useAssignClassMutation,
  useTransferStudentMutation,
  useListParentsQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useSetParentStatusMutation,
  useListChildrenQuery,
  useLinkChildMutation,
  useUnlinkChildMutation,
  useListStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSetStaffStatusMutation,
} = peopleApi;
