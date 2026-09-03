import { z } from "zod";

const time24h = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");

export const createTimetableSlotSchema = z
  .object({
    sectionId: z.string().min(1),
    subjectId: z.string().min(1),
    teacherId: z.string().min(1),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: time24h,
    endTime: time24h,
  })
  .refine((v) => v.startTime < v.endTime, { message: "End time must be after start time", path: ["endTime"] });
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;

export const updateTimetableSlotSchema = z.object({
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: time24h.optional(),
  endTime: time24h.optional(),
});
export type UpdateTimetableSlotInput = z.infer<typeof updateTimetableSlotSchema>;
