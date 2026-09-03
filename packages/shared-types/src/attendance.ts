export const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  sectionId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  notes: string | null;
  markedById: string;
  createdAt: string;
  updatedAt: string;
}

/** One roster row for the Mark Attendance screen — the student joined with today's record, if one exists yet. */
export interface AttendanceRosterEntry {
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: string | null;
  record: AttendanceRecord | null;
}

/** A student's own attendance history entry, with just enough section/date context to render without a second lookup. */
export interface AttendanceRecordWithSection extends AttendanceRecord {
  section: { id: string; name: string; className: string };
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Present + Late counted toward attendance, as a 0-100 rounded percentage. */
  percentPresent: number;
}
