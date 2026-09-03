import { z } from "zod";

const academicYearFields = {
  label: z.string().min(2).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
};

export const createAcademicYearSchema = z
  .object(academicYearFields)
  .refine((v) => v.endDate > v.startDate, { message: "End date must be after start date", path: ["endDate"] });
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

export const updateAcademicYearSchema = z.object(academicYearFields).partial();
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
