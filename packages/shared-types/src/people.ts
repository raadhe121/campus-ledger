import type { PublicUser } from "./user.js";

export const ParentRelation = {
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  GUARDIAN: "GUARDIAN",
  OTHER: "OTHER",
} as const;
export type ParentRelation = (typeof ParentRelation)[keyof typeof ParentRelation];

export const EnrollmentStatus = {
  ACTIVE: "ACTIVE",
  TRANSFERRED: "TRANSFERRED",
  WITHDRAWN: "WITHDRAWN",
  COMPLETED: "COMPLETED",
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export interface StudentProfile {
  id: string;
  schoolId: string;
  userId: string;
  admissionNo: string;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  admissionDate: string;
  // expanded per spec
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  profilePhotoUrl: string | null;
}

export interface StaffProfile {
  id: string;
  schoolId: string;
  userId: string;
  designation: string | null;
  department: string | null;
  joiningDate: string;
}

/** A STUDENT-role user with its 1:1 profile — the shape every students endpoint returns. */
export interface StudentWithProfile {
  user: PublicUser;
  profile: StudentProfile;
}

export interface StudentWithHistory extends StudentWithProfile {
  history: EnrollmentWithDetails[];
  currentEnrollment: EnrollmentWithDetails | null;
}

/** A TEACHER/ACCOUNTANT/STAFF-role user with its 1:1 profile. */
export interface StaffWithProfile {
  user: PublicUser;
  profile: StaffProfile;
}

export interface Enrollment {
  id: string;
  schoolId: string;
  studentId: string;
  sectionId: string;
  academicYearId: string;
  rollNo: string | null;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** An Enrollment joined with the bits a roster screen actually needs to render — no separate lookups. */
export interface EnrollmentWithDetails extends Enrollment {
  student: PublicUser;
  section: { id: string; name: string; classId: string; className: string };
  academicYear: { id: string; label: string };
  class: { id: string; name: string };
}

export interface ParentStudentLink {
  id: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  relation: ParentRelation;
  isPrimaryGuardian: boolean;
  createdAt: string;
}

/** A guardian link joined with the linked student's identity — what a parent's "my children" list renders. */
export interface ParentStudentLinkWithStudent extends ParentStudentLink {
  student: PublicUser;
}

// Spec: StudentClass/history alias — Enrollment IS the history row.
// This type makes the intent explicit for consumers expecting StudentClass.
export type StudentClass = EnrollmentWithDetails;
export interface StudentHistory {
  student: StudentWithProfile;
  history: StudentClass[];
}
