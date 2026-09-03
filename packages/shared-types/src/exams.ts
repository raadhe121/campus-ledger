export const ExamType = {
  UNIT_TEST: "UNIT_TEST",
  MIDTERM: "MIDTERM",
  FINAL: "FINAL",
  OTHER: "OTHER",
} as const;
export type ExamType = (typeof ExamType)[keyof typeof ExamType];

export interface Exam {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  type: ExamType;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubject {
  id: string;
  schoolId: string;
  examId: string;
  subjectId: string;
  sectionId: string;
  maxMarks: number;
  passMarks: number;
  examDate: string;
  createdAt: string;
  updatedAt: string;
}

/** An ExamSubject joined with the labels a marks-entry or results screen actually renders. */
export interface ExamSubjectWithDetails extends ExamSubject {
  exam: { id: string; name: string; type: ExamType };
  subject: { id: string; name: string; code: string };
  section: { id: string; name: string; className: string };
}

export interface Result {
  id: string;
  schoolId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  enteredById: string;
  createdAt: string;
  updatedAt: string;
}

/** One roster row for the marks-entry screen — the student joined with their existing Result, if one exists yet. */
export interface MarksRosterEntry {
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: string | null;
  result: Result | null;
}

/** A student's own result, joined with enough exam/subject context to render a report card row without a second lookup. */
export interface ResultWithDetails extends Result {
  examSubject: ExamSubjectWithDetails;
}
