import { z } from "zod";

const attendanceStatus = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

const markAttendanceEntrySchema = z.object({
  studentId: z.string().min(1),
  status: attendanceStatus,
  notes: z.string().max(300).optional(),
});

// One bulk call per section per date — the Mark Attendance screen submits
// every roster row's status together rather than one request per student.
export const markAttendanceSchema = z.object({
  sectionId: z.string().min(1),
  date: z.coerce.date(),
  records: z.array(markAttendanceEntrySchema).min(1),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

export const updateAttendanceRecordSchema = z.object({
  status: attendanceStatus.optional(),
  notes: z.string().max(300).nullable().optional(),
});
export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>;
