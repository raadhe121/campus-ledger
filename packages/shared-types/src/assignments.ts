export interface Assignment {
  id: string;
  schoolId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  description: string | null;
  dueDate: string;
  attachmentUrl: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** An Assignment joined with the labels a list screen renders — no separate lookups for section/subject/teacher name. */
export interface AssignmentWithDetails extends Assignment {
  section: { id: string; name: string; className: string };
  subject: { id: string; name: string; code: string };
  createdBy: { id: string; firstName: string; lastName: string };
}

/** An Assignment joined with the caller's own Submission, if any — what a student's assignment list actually needs. */
export interface AssignmentWithMySubmission extends AssignmentWithDetails {
  mySubmission: Submission | null;
}

export interface Submission {
  id: string;
  schoolId: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  grade: string | null;
  feedback: string | null;
  gradedById: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A Submission joined with the student's identity — what a Teacher's grading screen renders per row. */
export interface SubmissionWithStudent extends Submission {
  student: { id: string; firstName: string; lastName: string; email: string };
}
