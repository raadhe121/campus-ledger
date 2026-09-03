import { z } from "zod";

// Used by a Super Admin standing up a School Admin for a school. The same
// shape is the base every Phase 02 "add person" schema (people.ts) extends
// for Teacher/Student/Parent/Staff creation.
export const createSchoolAdminSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
});
export type CreateSchoolAdminInput = z.infer<typeof createSchoolAdminSchema>;
