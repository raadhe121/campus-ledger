import { z } from "zod";
import { createSchoolAdminSchema } from "./users.js";

// The base "add a person" shape is createSchoolAdminSchema itself (see its
// own comment) — every role School Admin provisions starts from the same
// identity fields, with a role-specific profile extending it.
const personFields = createSchoolAdminSchema.shape;

export const createStudentSchema = createSchoolAdminSchema.extend({
  admissionNo: z.string().min(1).max(50),
  dob: z.coerce.date().optional(),
  gender: z.string().max(30).optional(),
  bloodGroup: z.string().max(10).optional(),
  admissionDate: z.coerce.date().optional(),
  // --- expanded per spec: personal/contact/parent/emergency/photo ---
  address: z.string().max(500).optional(),
  guardianName: z.string().max(100).optional(),
  guardianPhone: z.string().max(30).optional(),
  guardianRelation: z.string().max(30).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  emergencyContactRelation: z.string().max(30).optional(),
  profilePhotoUrl: z.string().max(500).optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  firstName: personFields.firstName.optional(),
  lastName: personFields.lastName.optional(),
  phone: personFields.phone,
  admissionNo: z.string().min(1).max(50).optional(),
  dob: z.coerce.date().optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  admissionDate: z.coerce.date().optional(),
  address: z.string().max(500).optional().nullable(),
  guardianName: z.string().max(100).optional().nullable(),
  guardianPhone: z.string().max(30).optional().nullable(),
  guardianRelation: z.string().max(30).optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  emergencyContactRelation: z.string().max(30).optional().nullable(),
  profilePhotoUrl: z.string().max(500).optional().nullable(),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// Enroll / assign / transfer / promote schemas for StudentClass/history flows
export const enrollStudentSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1).optional(),
  sectionId: z.string().min(1),
  rollNo: z.string().max(20).optional(),
});
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;

export const assignClassSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  rollNo: z.string().max(20).optional(),
});
export type AssignClassInput = z.infer<typeof assignClassSchema>;

export const transferStudentSchema = z.object({
  targetSectionId: z.string().min(1),
  reason: z.string().max(300).optional(),
});
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;

export const promoteStudentsSchema = z.object({
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
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;

// The generic "staff" module covers both non-teaching STAFF and ACCOUNTANT
// (§03 — StaffProfile is shared by "teacher, accountant, staff"); TEACHER
// gets its own module (teachers.ts... see modules/teachers) with the role
// fixed server-side rather than accepted in the body.
export const createStaffSchema = createSchoolAdminSchema.extend({
  role: z.enum(["STAFF", "ACCOUNTANT"]).default("STAFF"),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  joiningDate: z.coerce.date().optional(),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  firstName: personFields.firstName.optional(),
  lastName: personFields.lastName.optional(),
  phone: personFields.phone,
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// TEACHER gets its own module and schema (role fixed server-side, never in
// the body) but the same StaffProfile-shaped fields as createStaffSchema.
export const createTeacherSchema = createSchoolAdminSchema.extend({
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  joiningDate: z.coerce.date().optional(),
});
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = updateStaffSchema;
export type UpdateTeacherInput = UpdateStaffInput;

export const createParentSchema = createSchoolAdminSchema;
export type CreateParentInput = z.infer<typeof createParentSchema>;

export const updateParentSchema = z.object({
  firstName: personFields.firstName.optional(),
  lastName: personFields.lastName.optional(),
  phone: personFields.phone,
});
export type UpdateParentInput = z.infer<typeof updateParentSchema>;

export const linkParentStudentSchema = z.object({
  studentId: z.string().min(1),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]),
  isPrimaryGuardian: z.boolean().optional(),
});
export type LinkParentStudentInput = z.infer<typeof linkParentStudentSchema>;

export const personStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});
export type PersonStatusInput = z.infer<typeof personStatusSchema>;
