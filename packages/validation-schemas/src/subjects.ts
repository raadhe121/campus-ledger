import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(30),
  isElective: z.boolean().optional(),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema.partial();
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
