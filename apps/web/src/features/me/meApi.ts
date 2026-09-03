import type {
  ApiSuccess,
  StudentWithProfile,
  StaffWithProfile,
  EnrollmentWithDetails,
  AttendanceRecordWithSection,
  AttendanceSummary,
  TimetableSlotWithDetails,
  ResultWithDetails,
  ExamSubjectWithDetails,
  AssignmentWithMySubmission,
  Submission,
  ParentStudentLinkWithStudent,
  StudentFeeWithDetails,
} from "@campus-ledger/shared-types";
import type { SubmitAssignmentInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";

export interface MyStudentDashboard {
  student: StudentWithProfile;
  history: EnrollmentWithDetails[];
  currentEnrollment: EnrollmentWithDetails | null;
}

export interface MyTeacherClass {
  id: string;
  name: string;
  roomNo: string | null;
  class: { id: string; name: string };
  academicYear: { id: string; label: string };
  roster: EnrollmentWithDetails[];
}

export interface MyTeacherDashboard {
  teacher: StaffWithProfile;
  classes: MyTeacherClass[];
}

export interface MyAttendance {
  records: AttendanceRecordWithSection[];
  summary: AttendanceSummary;
}

export interface MyResults {
  results: ResultWithDetails[];
  passCount: number;
  failCount: number;
}

// Self-service reads (and, for a Student's own assignment submission, one
// write) — architecture §07 gives Student "R (self)"/"R + submit" and
// Teacher "R (own)"/"CRU (own subject)" here, distinct from School
// Admin's "Manage" scope on /students, /staff, /timetable, /exams, ...
export const meApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyStudentDashboard: builder.query<ApiSuccess<MyStudentDashboard>, void>({
      query: () => "/me/student",
      providesTags: ["MyStudentDashboard"],
    }),
    getMyTeacherDashboard: builder.query<ApiSuccess<MyTeacherDashboard>, void>({
      query: () => "/me/teacher",
      providesTags: ["MyTeacherDashboard"],
    }),
    getMyAttendance: builder.query<ApiSuccess<MyAttendance>, void>({
      query: () => "/me/attendance",
      providesTags: ["MyAttendance"],
    }),
    getMyTimetable: builder.query<ApiSuccess<TimetableSlotWithDetails[]>, void>({
      query: () => "/me/timetable",
      providesTags: ["MyTimetable"],
    }),
    getMyResults: builder.query<ApiSuccess<MyResults>, void>({
      query: () => "/me/results",
      providesTags: ["MyResults"],
    }),
    getMyExamSubjects: builder.query<ApiSuccess<ExamSubjectWithDetails[]>, void>({
      query: () => "/me/exam-subjects",
      providesTags: ["MyExamSubjects"],
    }),
    getMyAssignments: builder.query<ApiSuccess<AssignmentWithMySubmission[]>, void>({
      query: () => "/me/assignments",
      providesTags: ["MyAssignments"],
    }),
    submitMyAssignment: builder.mutation<ApiSuccess<Submission>, { assignmentId: string; body: SubmitAssignmentInput }>({
      query: ({ assignmentId, body }) => ({ url: `/me/assignments/${assignmentId}/submit`, method: "POST", body }),
      invalidatesTags: ["MyAssignments"],
    }),
    getMyFees: builder.query<ApiSuccess<StudentFeeWithDetails[]>, void>({
      query: () => "/me/fees",
      providesTags: ["MyFees"],
    }),

    // §07: Parent's "R (children)" — the same five reads above, fanned out
    // across every linked child via :studentId rather than hardcoded to
    // the caller. Ownership (this child is actually linked to this
    // parent) is enforced server-side, not by anything client-side.
    getMyChildren: builder.query<ApiSuccess<ParentStudentLinkWithStudent[]>, void>({
      query: () => "/me/children",
      providesTags: ["MyChildren"],
    }),
    getChildDashboard: builder.query<ApiSuccess<MyStudentDashboard>, string>({
      query: (studentId) => `/me/children/${studentId}/dashboard`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildDashboard", id: studentId }],
    }),
    getChildAttendance: builder.query<ApiSuccess<MyAttendance>, string>({
      query: (studentId) => `/me/children/${studentId}/attendance`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildAttendance", id: studentId }],
    }),
    getChildTimetable: builder.query<ApiSuccess<TimetableSlotWithDetails[]>, string>({
      query: (studentId) => `/me/children/${studentId}/timetable`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildTimetable", id: studentId }],
    }),
    getChildResults: builder.query<ApiSuccess<MyResults>, string>({
      query: (studentId) => `/me/children/${studentId}/results`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildResults", id: studentId }],
    }),
    getChildAssignments: builder.query<ApiSuccess<AssignmentWithMySubmission[]>, string>({
      query: (studentId) => `/me/children/${studentId}/assignments`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildAssignments", id: studentId }],
    }),
    getChildFees: builder.query<ApiSuccess<StudentFeeWithDetails[]>, string>({
      query: (studentId) => `/me/children/${studentId}/fees`,
      providesTags: (_r, _e, studentId) => [{ type: "ChildFees", id: studentId }],
    }),
  }),
});

export const {
  useGetMyStudentDashboardQuery,
  useGetMyTeacherDashboardQuery,
  useGetMyAttendanceQuery,
  useGetMyTimetableQuery,
  useGetMyResultsQuery,
  useGetMyExamSubjectsQuery,
  useGetMyAssignmentsQuery,
  useSubmitMyAssignmentMutation,
  useGetMyFeesQuery,
  useGetMyChildrenQuery,
  useGetChildDashboardQuery,
  useGetChildAttendanceQuery,
  useGetChildTimetableQuery,
  useGetChildResultsQuery,
  useGetChildAssignmentsQuery,
  useGetChildFeesQuery,
} = meApi;
