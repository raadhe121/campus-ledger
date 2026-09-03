import type { ApiSuccess, TimetableSlotWithDetails } from "@campus-ledger/shared-types";
import type { CreateTimetableSlotInput, UpdateTimetableSlotInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";
import type { Paginated } from "../../lib/apiTypes";

// School Admin's "Manage" scope on the whole school's schedule (§07) —
// Teacher/Student's own read-only slice lives in features/me/meApi.ts.
export const timetableApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listTimetableSlots: builder.query<Paginated<TimetableSlotWithDetails>, { sectionId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/timetable", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "TimetableSlot" as const, id: s.id })), { type: "TimetableSlot", id: "LIST" }]
          : [{ type: "TimetableSlot", id: "LIST" }],
    }),
    createTimetableSlot: builder.mutation<ApiSuccess<TimetableSlotWithDetails>, CreateTimetableSlotInput>({
      query: (body) => ({ url: "/timetable", method: "POST", body }),
      invalidatesTags: [{ type: "TimetableSlot", id: "LIST" }],
    }),
    updateTimetableSlot: builder.mutation<ApiSuccess<TimetableSlotWithDetails>, { slotId: string; body: UpdateTimetableSlotInput }>({
      query: ({ slotId, body }) => ({ url: `/timetable/${slotId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { slotId }) => [{ type: "TimetableSlot", id: slotId }, { type: "TimetableSlot", id: "LIST" }],
    }),
    deleteTimetableSlot: builder.mutation<void, string>({
      query: (slotId) => ({ url: `/timetable/${slotId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "TimetableSlot", id: "LIST" }],
    }),
  }),
});

export const { useListTimetableSlotsQuery, useCreateTimetableSlotMutation, useUpdateTimetableSlotMutation, useDeleteTimetableSlotMutation } = timetableApi;
