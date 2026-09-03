import { z } from "zod";

const examFields = {
  academicYearId: z.string().min(1),
  name: z.string().min(2).max(100),
  type: z.enum(["UNIT_TEST", "MIDTERM", "FINAL", "OTHER"]).default("OTHER"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
};

export const createExamSchema = z
  .object(examFields)
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be on or after the start date", path: ["endDate"] });
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(["UNIT_TEST", "MIDTERM", "FINAL", "OTHER"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

export const createExamSubjectSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  maxMarks: z.number().int().positive(),
  passMarks: z.number().int().min(0),
  examDate: z.coerce.date(),
});
export type CreateExamSubjectInput = z.infer<typeof createExamSubjectSchema>;

export const updateExamSubjectSchema = z.object({
  maxMarks: z.number().int().positive().optional(),
  passMarks: z.number().int().min(0).optional(),
  examDate: z.coerce.date().optional(),
});
export type UpdateExamSubjectInput = z.infer<typeof updateExamSubjectSchema>;

const marksEntrySchema = z.object({
  studentId: z.string().min(1),
  marksObtained: z.number().min(0),
  grade: z.string().max(10).optional(),
  remarks: z.string().max(300).optional(),
});

// One bulk call per exam subject — the marks-entry screen submits every
// roster row's mark together, mirroring markAttendanceSchema (§07).
export const enterMarksSchema = z.object({
  records: z.array(marksEntrySchema).min(1),
});
export type EnterMarksInput = z.infer<typeof enterMarksSchema>;
