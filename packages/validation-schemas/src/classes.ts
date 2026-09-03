import { z } from "zod";

export const createClassSchema = z.object({
  academicYearId: z.string().min(1),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0).optional(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

// academicYearId is immutable after creation — moving a class between years
// is a new-class-and-migrate-sections operation, not a field edit.
export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
});
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
