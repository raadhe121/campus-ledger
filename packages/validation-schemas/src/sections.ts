import { z } from "zod";

export const createSectionSchema = z.object({
  classId: z.string().min(1),
  name: z.string().min(1).max(50),
  roomNo: z.string().max(50).optional(),
  classTeacherId: z.string().min(1).optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  roomNo: z.string().max(50).nullable().optional(),
  classTeacherId: z.string().min(1).nullable().optional(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
