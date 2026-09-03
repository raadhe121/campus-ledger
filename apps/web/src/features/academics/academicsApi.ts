import type { ApiSuccess, AcademicYear, Class, Section, Subject } from "@campus-ledger/shared-types";
import type {
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateClassInput,
  UpdateClassInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreateSubjectInput,
  UpdateSubjectInput,
} from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// School Admin's own core setup (architecture §11 Phase 02) — academic
// years, classes, sections and subjects all live under the caller's own
// school, scoped by their JWT rather than an explicit :schoolId (§08).
export const academicsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAcademicYears: builder.query<Paginated<AcademicYear>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/academic-years", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((y) => ({ type: "AcademicYear" as const, id: y.id })), { type: "AcademicYear", id: "LIST" }]
          : [{ type: "AcademicYear", id: "LIST" }],
    }),
    createAcademicYear: builder.mutation<ApiSuccess<AcademicYear>, CreateAcademicYearInput>({
      query: (body) => ({ url: "/academic-years", method: "POST", body }),
      invalidatesTags: [{ type: "AcademicYear", id: "LIST" }],
    }),
    updateAcademicYear: builder.mutation<ApiSuccess<AcademicYear>, { yearId: string; body: UpdateAcademicYearInput }>({
      query: ({ yearId, body }) => ({ url: `/academic-years/${yearId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { yearId }) => [{ type: "AcademicYear", id: yearId }, { type: "AcademicYear", id: "LIST" }],
    }),
    activateAcademicYear: builder.mutation<ApiSuccess<AcademicYear>, string>({
      query: (yearId) => ({ url: `/academic-years/${yearId}/activate`, method: "POST" }),
      invalidatesTags: [{ type: "AcademicYear", id: "LIST" }],
    }),
    deleteAcademicYear: builder.mutation<void, string>({
      query: (yearId) => ({ url: `/academic-years/${yearId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "AcademicYear", id: "LIST" }],
    }),

    listClasses: builder.query<Paginated<Class>, { academicYearId?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/classes", params: params ?? undefined }),
      providesTags: (result) =>
        result ? [...result.data.map((c) => ({ type: "Class" as const, id: c.id })), { type: "Class", id: "LIST" }] : [{ type: "Class", id: "LIST" }],
    }),
    createClass: builder.mutation<ApiSuccess<Class>, CreateClassInput>({
      query: (body) => ({ url: "/classes", method: "POST", body }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),
    updateClass: builder.mutation<ApiSuccess<Class>, { classId: string; body: UpdateClassInput }>({
      query: ({ classId, body }) => ({ url: `/classes/${classId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { classId }) => [{ type: "Class", id: classId }, { type: "Class", id: "LIST" }],
    }),
    deleteClass: builder.mutation<void, string>({
      query: (classId) => ({ url: `/classes/${classId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),

    listSections: builder.query<Paginated<Section>, { classId?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/sections", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "Section" as const, id: s.id })), { type: "Section", id: "LIST" }]
          : [{ type: "Section", id: "LIST" }],
    }),
    createSection: builder.mutation<ApiSuccess<Section>, CreateSectionInput>({
      query: (body) => ({ url: "/sections", method: "POST", body }),
      invalidatesTags: [{ type: "Section", id: "LIST" }],
    }),
    updateSection: builder.mutation<ApiSuccess<Section>, { sectionId: string; body: UpdateSectionInput }>({
      query: ({ sectionId, body }) => ({ url: `/sections/${sectionId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { sectionId }) => [{ type: "Section", id: sectionId }, { type: "Section", id: "LIST" }],
    }),
    deleteSection: builder.mutation<void, string>({
      query: (sectionId) => ({ url: `/sections/${sectionId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Section", id: "LIST" }],
    }),

    listSubjects: builder.query<Paginated<Subject>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/subjects", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "Subject" as const, id: s.id })), { type: "Subject", id: "LIST" }]
          : [{ type: "Subject", id: "LIST" }],
    }),
    createSubject: builder.mutation<ApiSuccess<Subject>, CreateSubjectInput>({
      query: (body) => ({ url: "/subjects", method: "POST", body }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),
    updateSubject: builder.mutation<ApiSuccess<Subject>, { subjectId: string; body: UpdateSubjectInput }>({
      query: ({ subjectId, body }) => ({ url: `/subjects/${subjectId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { subjectId }) => [{ type: "Subject", id: subjectId }, { type: "Subject", id: "LIST" }],
    }),
    deleteSubject: builder.mutation<void, string>({
      query: (subjectId) => ({ url: `/subjects/${subjectId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),
  }),
});

export const {
  useListAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useActivateAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useListClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useListSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = academicsApi;
