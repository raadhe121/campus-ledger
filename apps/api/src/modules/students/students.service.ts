import type { Prisma, StudentProfile, User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { provisionSchoolUser } from "../../lib/provisionUser.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import { toPublicUser } from "../users/user.mapper.js";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  PersonStatusInput,
  EnrollStudentInput,
  AssignClassInput,
  TransferStudentInput,
} from "@campus-ledger/validation-schemas";
import type { StudentWithProfile, EnrollmentWithDetails } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  student: true,
  section: { include: { class: true } },
  academicYear: true,
} as const;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toEnrollmentDetails(row: EnrollmentRow): EnrollmentWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    studentId: row.studentId,
    sectionId: row.sectionId,
    academicYearId: row.academicYearId,
    rollNo: row.rollNo,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    student: toPublicUser(row.student),
    section: { id: row.section.id, name: row.section.name, classId: row.section.classId, className: row.section.class.name },
    academicYear: { id: row.academicYear.id, label: row.academicYear.label },
    class: { id: row.section.class.id, name: row.section.class.name },
  };
}

function toStudentWithProfile(user: User, profile: StudentProfile): StudentWithProfile {
  return {
    user: toPublicUser(user),
    profile: {
      id: profile.id,
      schoolId: profile.schoolId,
      userId: profile.userId,
      admissionNo: profile.admissionNo,
      dob: profile.dob?.toISOString() ?? null,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      admissionDate: profile.admissionDate.toISOString(),
      address: profile.address ?? null,
      guardianName: profile.guardianName ?? null,
      guardianPhone: profile.guardianPhone ?? null,
      guardianRelation: profile.guardianRelation ?? null,
      emergencyContactName: profile.emergencyContactName ?? null,
      emergencyContactPhone: profile.emergencyContactPhone ?? null,
      emergencyContactRelation: profile.emergencyContactRelation ?? null,
      profilePhotoUrl: profile.profilePhotoUrl ?? null,
    },
  };
}

export async function createStudent(
  input: CreateStudentInput,
  actorUserId: string,
  schoolId: string,
): Promise<{ result: StudentWithProfile; tempPassword: string }> {
  const {
    admissionNo,
    dob,
    gender,
    bloodGroup,
    admissionDate,
    address,
    guardianName,
    guardianPhone,
    guardianRelation,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
    profilePhotoUrl,
    ...personInput
  } = input;

  const existing = await prisma.studentProfile.findFirst({ where: { admissionNo } });
  if (existing) throw new ConflictError("A student with this admission number already exists");

  const { user, tempPassword } = await provisionSchoolUser("STUDENT", personInput);
  const profile = await prisma.studentProfile.create({
    data: {
      userId: user.id,
      schoolId,
      admissionNo,
      dob: dob ?? undefined,
      gender: gender ?? undefined,
      bloodGroup: bloodGroup ?? undefined,
      admissionDate: admissionDate ?? undefined,
      address: address ?? undefined,
      guardianName: guardianName ?? undefined,
      guardianPhone: guardianPhone ?? undefined,
      guardianRelation: guardianRelation ?? undefined,
      emergencyContactName: emergencyContactName ?? undefined,
      emergencyContactPhone: emergencyContactPhone ?? undefined,
      emergencyContactRelation: emergencyContactRelation ?? undefined,
      profilePhotoUrl: profilePhotoUrl ?? undefined,
    },
  });

  await writeAuditLog({ actorUserId, action: "student.create", targetSchoolId: schoolId, entity: "User", entityId: user.id });

  return { result: toStudentWithProfile(user, profile), tempPassword };
}

export async function listStudents(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.UserWhereInput = { role: "STUDENT" as const };
  if (typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { studentProfile: { admissionNo: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { studentProfile: true },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    students: rows.filter((r) => r.studentProfile).map((r) => toStudentWithProfile(r, r.studentProfile!)),
    meta: paginationMeta(total, page),
  };
}

/** List students who have an ACTIVE enrollment in a given year/class/section — the "current roster". */
export async function listCurrentStudents(query: Record<string, unknown>, schoolId: string) {
  const page = parsePagination(query);
  let academicYearId = typeof query.academicYearId === "string" ? query.academicYearId : undefined;
  const classId = typeof query.classId === "string" ? query.classId : undefined;
  const sectionId = typeof query.sectionId === "string" ? query.sectionId : undefined;
  const status = typeof query.status === "string" ? query.status : "ACTIVE";

  if (!academicYearId) {
    const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (active) academicYearId = active.id;
  }

  const where: Prisma.EnrollmentWhereInput = {};
  if (academicYearId) where.academicYearId = academicYearId;
  if (sectionId) where.sectionId = sectionId;
  if (status) where.status = status as never;
  if (classId) where.section = { classId };

  // If no academic year could be resolved, fall back to all active enrollments
  const enrollmentWhere = Object.keys(where).length ? where : { status: "ACTIVE" as const };

  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { ...DETAIL_INCLUDE, student: { include: { studentProfile: true } } } as never,
      orderBy: [{ academicYear: { startDate: "desc" } }, { createdAt: "desc" }],
      skip: page.skip,
      take: page.limit,
    }) as Promise<Array<EnrollmentRow & { student: User & { studentProfile: StudentProfile | null } }>>,
    prisma.enrollment.count({ where: enrollmentWhere }),
  ]);

  const students = rows
    .filter((r) => (r.student as unknown as { studentProfile: StudentProfile | null }).studentProfile)
    .map((r) => {
      const s = r.student as unknown as User & { studentProfile: StudentProfile };
      return {
        ...toStudentWithProfile(s, s.studentProfile),
        currentEnrollment: toEnrollmentDetails(r as EnrollmentRow),
      };
    });

  // Also support view that just needs enrollment details with student
  const enrollments = rows.map(toEnrollmentDetails);

  return { students, enrollments, meta: paginationMeta(total, page) };
}

async function findStudentOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { studentProfile: true } });
  if (!user || user.role !== "STUDENT" || !user.studentProfile) throw new NotFoundError("Student not found");
  return { user, profile: user.studentProfile };
}

export async function getStudent(userId: string): Promise<StudentWithProfile> {
  const { user, profile } = await findStudentOrThrow(userId);
  return toStudentWithProfile(user, profile);
}

export async function getStudentHistory(userId: string): Promise<{ student: StudentWithProfile; history: EnrollmentWithDetails[]; currentEnrollment: EnrollmentWithDetails | null }> {
  const { user, profile } = await findStudentOrThrow(userId);
  const historyRows = await prisma.enrollment.findMany({
    where: { studentId: userId },
    include: DETAIL_INCLUDE,
    orderBy: [{ academicYear: { startDate: "asc" } }, { createdAt: "asc" }],
  });

  const history = historyRows.map(toEnrollmentDetails);
  // current is latest ACTIVE or latest overall
  const currentEnrollment = [...history].reverse().find((h) => h.status === "ACTIVE") ?? history[history.length - 1] ?? null;

  return { student: toStudentWithProfile(user, profile), history, currentEnrollment };
}

export async function updateStudent(userId: string, input: UpdateStudentInput, actorUserId: string, schoolId: string): Promise<StudentWithProfile> {
  const { firstName, lastName, phone, admissionNo, dob, gender, bloodGroup, admissionDate, address, guardianName, guardianPhone, guardianRelation, emergencyContactName, emergencyContactPhone, emergencyContactRelation, profilePhotoUrl } = input;
  const { profile } = await findStudentOrThrow(userId);

  if (admissionNo && admissionNo !== profile.admissionNo) {
    const clash = await prisma.studentProfile.findFirst({ where: { admissionNo } });
    if (clash) throw new ConflictError("A student with this admission number already exists");
  }

  const userData: Record<string, unknown> = {};
  if (firstName !== undefined) userData.firstName = firstName;
  if (lastName !== undefined) userData.lastName = lastName;
  if (phone !== undefined) userData.phone = phone;

  const profileData: Record<string, unknown> = {};
  if (admissionNo !== undefined) profileData.admissionNo = admissionNo;
  if (dob !== undefined) profileData.dob = dob;
  if (gender !== undefined) profileData.gender = gender;
  if (bloodGroup !== undefined) profileData.bloodGroup = bloodGroup;
  if (admissionDate !== undefined) profileData.admissionDate = admissionDate;
  if (address !== undefined) profileData.address = address;
  if (guardianName !== undefined) profileData.guardianName = guardianName;
  if (guardianPhone !== undefined) profileData.guardianPhone = guardianPhone;
  if (guardianRelation !== undefined) profileData.guardianRelation = guardianRelation;
  if (emergencyContactName !== undefined) profileData.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) profileData.emergencyContactPhone = emergencyContactPhone;
  if (emergencyContactRelation !== undefined) profileData.emergencyContactRelation = emergencyContactRelation;
  if (profilePhotoUrl !== undefined) profileData.profilePhotoUrl = profilePhotoUrl;

  const [user, updatedProfile] = await Promise.all([
    Object.keys(userData).length ? prisma.user.update({ where: { id: userId }, data: userData }) : prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    Object.keys(profileData).length ? prisma.studentProfile.update({ where: { id: profile.id }, data: profileData }) : Promise.resolve(profile),
  ]);

  await writeAuditLog({ actorUserId, action: "student.update", targetSchoolId: schoolId, entity: "User", entityId: userId, diff: input });

  return toStudentWithProfile(user as User, updatedProfile as StudentProfile);
}

/** Deactivate/reactivate rather than delete (§05) — a withdrawn student's Enrollment history stays queryable either way. */
export async function setStudentStatus(userId: string, input: PersonStatusInput, actorUserId: string, schoolId: string): Promise<StudentWithProfile> {
  const { profile } = await findStudentOrThrow(userId);

  const user = await prisma.user.update({
    where: { id: userId },
    data: input.status === "DISABLED" ? { status: input.status, tokenVersion: { increment: 1 } } : { status: input.status },
  });

  await writeAuditLog({
    actorUserId,
    action: "student.status_change",
    targetSchoolId: schoolId,
    entity: "User",
    entityId: userId,
    diff: { status: input.status },
  });

  return toStudentWithProfile(user, profile);
}

// ---------------------------------------------------------------------------
// Enrollment flows owned by the student module (StudentClass/history)
// ---------------------------------------------------------------------------

export async function enrollStudent(
  studentId: string,
  input: EnrollStudentInput,
  actorUserId: string,
  schoolId: string,
): Promise<EnrollmentWithDetails> {
  const { user } = await findStudentOrThrow(studentId);

  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new NotFoundError("Academic year not found");

  const section = await prisma.section.findUnique({ where: { id: input.sectionId }, include: { class: true } });
  if (!section) throw new NotFoundError("Section not found");
  if (section.class.academicYearId !== input.academicYearId) throw new ValidationError("Section does not belong to the specified academic year");

  if (input.classId) {
    if (section.classId !== input.classId) throw new ValidationError("Section does not belong to the specified class");
    const cls = await prisma.class.findUnique({ where: { id: input.classId } });
    if (!cls) throw new NotFoundError("Class not found");
    if (cls.academicYearId !== input.academicYearId) throw new ValidationError("Class does not belong to the specified academic year");
  }

  const existing = await prisma.enrollment.findFirst({ where: { studentId, academicYearId: input.academicYearId } });
  if (existing) throw new ConflictError("This student already has an enrollment for this academic year — use transfer or promote");

  const enrollment = await prisma.enrollment.create({
    data: { studentId, sectionId: input.sectionId, academicYearId: input.academicYearId, rollNo: input.rollNo, schoolId },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({ actorUserId, action: "student.enroll", targetSchoolId: schoolId, entity: "Enrollment", entityId: enrollment.id, diff: { studentId, ...input } });

  return toEnrollmentDetails(enrollment);
}

export async function assignClass(
  studentId: string,
  input: AssignClassInput,
  actorUserId: string,
  schoolId: string,
): Promise<EnrollmentWithDetails> {
  // Strict: classId required, section must belong to class, class to year
  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new NotFoundError("Academic year not found");
  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls) throw new NotFoundError("Class not found");
  if (cls.academicYearId !== input.academicYearId) throw new ValidationError("Class does not belong to the specified academic year");
  const section = await prisma.section.findUnique({ where: { id: input.sectionId }, include: { class: true } });
  if (!section) throw new NotFoundError("Section not found");
  if (section.classId !== input.classId) throw new ValidationError("Section does not belong to the specified class");

  const existing = await prisma.enrollment.findFirst({ where: { studentId, academicYearId: input.academicYearId } });
  if (existing) throw new ConflictError("This student already has an enrollment for this academic year");

  const enrollment = await prisma.enrollment.create({
    data: { studentId, sectionId: input.sectionId, academicYearId: input.academicYearId, rollNo: input.rollNo, schoolId },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({ actorUserId, action: "student.assign_class", targetSchoolId: schoolId, entity: "Enrollment", entityId: enrollment.id, diff: { studentId, ...input } });
  return toEnrollmentDetails(enrollment);
}

export async function transferStudent(
  studentId: string,
  input: TransferStudentInput,
  actorUserId: string,
  schoolId: string,
): Promise<EnrollmentWithDetails> {
  await findStudentOrThrow(studentId);

  const targetSection = await prisma.section.findUnique({ where: { id: input.targetSectionId }, include: { class: true } });
  if (!targetSection) throw new NotFoundError("Target section not found");

  // Find the ACTIVE enrollment whose academicYear matches the target section's year.
  // If none, fall back to latest ACTIVE enrollment.
  const targetYearId = targetSection.class.academicYearId;
  let enrollment = await prisma.enrollment.findFirst({
    where: { studentId, academicYearId: targetYearId, status: "ACTIVE" },
    include: DETAIL_INCLUDE,
  });

  if (!enrollment) {
    // No enrollment in target year — can't intra-year transfer, maybe they meant promote? Surface clear error.
    throw new ValidationError("No ACTIVE enrollment found for this student in the target section's academic year — use enroll/promote instead");
  }

  if (enrollment.sectionId === input.targetSectionId) throw new ValidationError("Student is already in the target section");

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { sectionId: input.targetSectionId },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({
    actorUserId,
    action: "student.transfer",
    targetSchoolId: schoolId,
    entity: "Enrollment",
    entityId: enrollment.id,
    diff: { fromSectionId: enrollment.sectionId, toSectionId: input.targetSectionId, reason: input.reason },
  });

  return toEnrollmentDetails(updated);
}
