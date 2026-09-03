export interface TimetableSlot {
  id: string;
  schoolId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 0 (Sunday) .. 6 (Saturday), matches Date#getDay()
  startTime: string; // "HH:MM", 24-hour
  endTime: string; // "HH:MM", 24-hour
  createdAt: string;
  updatedAt: string;
}

/** A slot joined with the labels a schedule screen renders — no separate lookups for section/subject/teacher names. */
export interface TimetableSlotWithDetails extends TimetableSlot {
  section: { id: string; name: string; className: string };
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
}
