import { z } from "zod";

const statSchema = z.object({ title: z.string().min(1).max(60), value: z.string().min(1).max(40) });
const highlightSchema = z.object({ title: z.string().min(1).max(80), description: z.string().max(300).optional() });
const campusSchema = z.object({ name: z.string().min(1).max(100), address: z.string().min(1).max(300) });

// Capped at 12 — these are hand-curated "our key facts" style lists, not a
// growing feed (that's what Announcements is for); a school genuinely
// listing more than a dozen stats/programs/campuses needs a real page
// builder, not this.
const MAX_LIST_ITEMS = 12;

export const updateSchoolWebsiteSchema = z.object({
  tagline: z.string().max(200).nullable().optional(),
  heroImageUrl: z.string().url().max(500).nullable().optional(),
  aboutText: z.string().max(5000).nullable().optional(),
  admissionsText: z.string().max(5000).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  philosophyText: z.string().max(3000).nullable().optional(),
  philosophyImageUrl: z.string().url().max(500).nullable().optional(),
  stats: z.array(statSchema).max(MAX_LIST_ITEMS).optional(),
  highlights: z.array(highlightSchema).max(MAX_LIST_ITEMS).optional(),
  programs: z.array(highlightSchema).max(MAX_LIST_ITEMS).optional(),
  campuses: z.array(campusSchema).max(MAX_LIST_ITEMS).optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2563eb")
    .optional(),
});
export type UpdateSchoolWebsiteInput = z.infer<typeof updateSchoolWebsiteSchema>;

export const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(150),
  body: z.string().min(1).max(3000),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
