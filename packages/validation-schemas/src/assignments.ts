import { z } from "zod";

export const createAssignmentSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date(),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

// No file upload wired up yet (§12) — a submission is text content: a
// written answer, or a link to work hosted elsewhere.
export const submitAssignmentSchema = z.object({
  content: z.string().min(1).max(5000),
});
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  grade: z.string().min(1).max(10),
  feedback: z.string().max(2000).optional(),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
