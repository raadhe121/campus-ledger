import type { ApiSuccess, AttendanceRecord, AttendanceRosterEntry } from "@campus-ledger/shared-types";
import type { MarkAttendanceInput, UpdateAttendanceRecordInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";

// School Admin has "Manage"; Teacher has "CRU (own class)" — the same
// section-scoped endpoints, with ownership enforced server-side (§07).
export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceRoster: builder.query<ApiSuccess<AttendanceRosterEntry[]>, { sectionId: string; date: string }>({
      query: ({ sectionId, date }) => ({ url: "/attendance/roster", params: { sectionId, date } }),
      providesTags: (_r, _e, { sectionId, date }) => [{ type: "AttendanceRoster", id: `${sectionId}:${date}` }],
    }),
    markAttendance: builder.mutation<ApiSuccess<AttendanceRecord[]>, MarkAttendanceInput>({
      query: (body) => ({ url: "/attendance", method: "POST", body }),
      invalidatesTags: (_r, _e, { sectionId, date }) => [{ type: "AttendanceRoster", id: `${sectionId}:${date.toISOString().slice(0, 10)}` }, "MyAttendance"],
    }),
    updateAttendanceRecord: builder.mutation<ApiSuccess<AttendanceRecord>, { recordId: string; sectionId: string; date: string; body: UpdateAttendanceRecordInput }>({
      query: ({ recordId, body }) => ({ url: `/attendance/${recordId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { sectionId, date }) => [{ type: "AttendanceRoster", id: `${sectionId}:${date}` }, "MyAttendance"],
    }),
  }),
});

export const { useGetAttendanceRosterQuery, useMarkAttendanceMutation, useUpdateAttendanceRecordMutation } = attendanceApi;
