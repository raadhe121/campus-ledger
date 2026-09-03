import type { ApiSuccess, SchoolWebsiteWithSchool, SchoolAnnouncement } from "@campus-ledger/shared-types";
import type { UpdateSchoolWebsiteInput, CreateAnnouncementInput, UpdateAnnouncementInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";

// School Admin's editor for their own public site — the management half
// of the public-website feature. The public half (what a signed-out
// visitor sees, served by apps/school-site) never goes through this
// slice at all — it's a completely different, unauthenticated app.
export const websiteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyWebsite: builder.query<ApiSuccess<SchoolWebsiteWithSchool>, void>({
      query: () => "/school-website",
      providesTags: ["SchoolWebsite"],
    }),
    updateMyWebsite: builder.mutation<ApiSuccess<SchoolWebsiteWithSchool>, UpdateSchoolWebsiteInput>({
      query: (body) => ({ url: "/school-website", method: "PATCH", body }),
      invalidatesTags: ["SchoolWebsite"],
    }),
    publishWebsite: builder.mutation<ApiSuccess<SchoolWebsiteWithSchool>, void>({
      query: () => ({ url: "/school-website/publish", method: "POST" }),
      invalidatesTags: ["SchoolWebsite"],
    }),
    unpublishWebsite: builder.mutation<ApiSuccess<SchoolWebsiteWithSchool>, void>({
      query: () => ({ url: "/school-website/unpublish", method: "POST" }),
      invalidatesTags: ["SchoolWebsite"],
    }),

    listAnnouncements: builder.query<ApiSuccess<SchoolAnnouncement[]>, void>({
      query: () => "/school-website/announcements",
      providesTags: (result) =>
        result ? [...result.data.map((a) => ({ type: "Announcement" as const, id: a.id })), { type: "Announcement" as const, id: "LIST" }] : [{ type: "Announcement" as const, id: "LIST" }],
    }),
    createAnnouncement: builder.mutation<ApiSuccess<SchoolAnnouncement>, CreateAnnouncementInput>({
      query: (body) => ({ url: "/school-website/announcements", method: "POST", body }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }],
    }),
    updateAnnouncement: builder.mutation<ApiSuccess<SchoolAnnouncement>, { announcementId: string; body: UpdateAnnouncementInput }>({
      query: ({ announcementId, body }) => ({ url: `/school-website/announcements/${announcementId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { announcementId }) => [{ type: "Announcement", id: announcementId }, { type: "Announcement", id: "LIST" }],
    }),
    deleteAnnouncement: builder.mutation<void, string>({
      query: (announcementId) => ({ url: `/school-website/announcements/${announcementId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMyWebsiteQuery,
  useUpdateMyWebsiteMutation,
  usePublishWebsiteMutation,
  useUnpublishWebsiteMutation,
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = websiteApi;
