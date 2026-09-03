import { z } from "zod";

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  rollNo: z.string().max(20).optional(),
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  sectionId: z.string().min(1).optional(),
  rollNo: z.string().max(20).nullable().optional(),
  status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "COMPLETED"]).optional(),
});
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;

export const transferEnrollmentSchema = z.object({
  targetSectionId: z.string().min(1),
  reason: z.string().max(300).optional(),
});
export type TransferEnrollmentInput = z.infer<typeof transferEnrollmentSchema>;

export const promoteEnrollmentsSchema = z.object({
  sourceAcademicYearId: z.string().min(1),
  targetAcademicYearId: z.string().min(1),
  promotions: z.array(
    z.object({
      studentId: z.string().min(1),
      targetSectionId: z.string().min(1),
      rollNo: z.string().max(20).optional(),
    }),
  ).min(1).max(200),
});
export type PromoteEnrollmentsInput = z.infer<typeof promoteEnrollmentsSchema>;
