import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  address: z.string().max(500).optional(),
});
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;

export const updateSchoolSchema = createSchoolSchema.partial();
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;

export const schoolStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});
export type SchoolStatusInput = z.infer<typeof schoolStatusSchema>;
