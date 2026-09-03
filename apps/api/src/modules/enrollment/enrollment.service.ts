import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import { toPublicUser } from "../users/user.mapper.js";
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  TransferEnrollmentInput,
  PromoteEnrollmentsInput,
} from "@campus-ledger/validation-schemas";
import type { EnrollmentWithDetails } from "@campus-ledger/shared-types";

const DETAIL_INCLUDE = {
  student: true,
  section: { include: { class: true } },
  academicYear: true,
} as const;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: EnrollmentRow): EnrollmentWithDetails {
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

export async function createEnrollment(input: CreateEnrollmentInput, actorUserId: string, schoolId: string): Promise<EnrollmentWithDetails> {
  const student = await prisma.user.findUnique({ where: { id: input.studentId } });
  if (!student || student.role !== "STUDENT") throw new ValidationError("studentId must be an existing student at this school");

  const section = await prisma.section.findUnique({ where: { id: input.sectionId }, include: { class: true } });
  if (!section) throw new NotFoundError("Section not found");

  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new NotFoundError("Academic year not found");

  if (section.class.academicYearId !== input.academicYearId) throw new ValidationError("Section does not belong to the specified academic year");

  const existing = await prisma.enrollment.findFirst({ where: { studentId: input.studentId, academicYearId: input.academicYearId } });
  if (existing) throw new ConflictError("This student already has an enrollment for this academic year");

  const enrollment = await prisma.enrollment.create({ data: { ...input, schoolId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "enrollment.create", targetSchoolId: schoolId, entity: "Enrollment", entityId: enrollment.id });

  return toDetails(enrollment);
}

export async function listEnrollments(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.EnrollmentWhereInput = {};
  for (const key of ["sectionId", "academicYearId", "studentId", "status", "schoolId"] as const) {
    if (typeof query[key] === "string") (where as Record<string, string>)[key] = query[key] as string;
  }
  if (typeof query.classId === "string") {
    where.section = { classId: query.classId as string };
  }

  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({ where, include: DETAIL_INCLUDE, orderBy: [{ academicYear: { startDate: "desc" } }, { createdAt: "desc" }], skip: page.skip, take: page.limit }),
    prisma.enrollment.count({ where }),
  ]);

  return { enrollments: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findEnrollmentOrThrow(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: DETAIL_INCLUDE });
  if (!enrollment) throw new NotFoundError("Enrollment not found");
  return enrollment;
}

export async function getEnrollment(enrollmentId: string): Promise<EnrollmentWithDetails> {
  return toDetails(await findEnrollmentOrThrow(enrollmentId));
}

/** Covers transfers (new sectionId), roll-number changes, and status transitions (e.g. → WITHDRAWN) — never a hard delete, so enrollment history stays queryable (§04). */
export async function updateEnrollment(
  enrollmentId: string,
  input: UpdateEnrollmentInput,
  actorUserId: string,
  schoolId: string,
): Promise<EnrollmentWithDetails> {
  await findEnrollmentOrThrow(enrollmentId);

  if (input.sectionId) {
    const section = await prisma.section.findUnique({ where: { id: input.sectionId }, include: { class: true } });
    if (!section) throw new NotFoundError("Section not found");
    // ensure section's year matches existing enrollment's year
    const existing = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (existing && section.class.academicYearId !== existing.academicYearId) throw new ValidationError("Target section does not belong to the same academic year as this enrollment");
  }

  const enrollment = await prisma.enrollment.update({ where: { id: enrollmentId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({
    actorUserId,
    action: "enrollment.update",
    targetSchoolId: schoolId,
    entity: "Enrollment",
    entityId: enrollmentId,
    diff: input,
  });

  return toDetails(enrollment);
}

export async function transferEnrollment(
  enrollmentId: string,
  input: TransferEnrollmentInput,
  actorUserId: string,
  schoolId: string,
): Promise<EnrollmentWithDetails> {
  const enrollment = await findEnrollmentOrThrow(enrollmentId);
  const targetSection = await prisma.section.findUnique({ where: { id: input.targetSectionId }, include: { class: true } });
  if (!targetSection) throw new NotFoundError("Target section not found");
  if (targetSection.class.academicYearId !== enrollment.academicYearId) throw new ValidationError("Target section must belong to the same academic year as the enrollment");
  if (enrollment.sectionId === input.targetSectionId) throw new ValidationError("Already in target section");
  if (enrollment.status !== "ACTIVE") throw new ValidationError("Only ACTIVE enrollments can be transferred");

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { sectionId: input.targetSectionId },
    include: DETAIL_INCLUDE,
  });

  await writeAuditLog({
    actorUserId,
    action: "enrollment.transfer",
    targetSchoolId: schoolId,
    entity: "Enrollment",
    entityId: enrollmentId,
    diff: { fromSectionId: enrollment.sectionId, toSectionId: input.targetSectionId, reason: input.reason },
  });

  return toDetails(updated);
}

export async function promoteEnrollments(input: PromoteEnrollmentsInput, actorUserId: string, schoolId: string) {
  const { sourceAcademicYearId, targetAcademicYearId, promotions } = input;

  if (sourceAcademicYearId === targetAcademicYearId) throw new ValidationError("Source and target academic years must be different");

  const [sourceYear, targetYear] = await Promise.all([
    prisma.academicYear.findUnique({ where: { id: sourceAcademicYearId } }),
    prisma.academicYear.findUnique({ where: { id: targetAcademicYearId } }),
  ]);
  if (!sourceYear) throw new NotFoundError("Source academic year not found");
  if (!targetYear) throw new NotFoundError("Target academic year not found");

  // Verify all target sections exist and belong to target year (batch fetch)
  const targetSectionIds = [...new Set(promotions.map((p) => p.targetSectionId))];
  const targetSections = await prisma.section.findMany({ where: { id: { in: targetSectionIds } }, include: { class: true } });
  const sectionMap = new Map(targetSections.map((s) => [s.id, s]));
  for (const p of promotions) {
    const sec = sectionMap.get(p.targetSectionId);
    if (!sec) throw new NotFoundError(`Target section ${p.targetSectionId} not found`);
    if (sec.class.academicYearId !== targetAcademicYearId) throw new ValidationError(`Target section ${p.targetSectionId} does not belong to target academic year`);
  }

  // Verify students exist and have source enrollment, and no target enrollment yet
  const studentIds = promotions.map((p) => p.studentId);
  const [students, sourceEnrollments, targetExisting] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: studentIds } } }),
    prisma.enrollment.findMany({ where: { studentId: { in: studentIds }, academicYearId: sourceAcademicYearId } }),
    prisma.enrollment.findMany({ where: { studentId: { in: studentIds }, academicYearId: targetAcademicYearId } }),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const sourceMap = new Map(sourceEnrollments.map((e) => [e.studentId, e]));
  const targetSet = new Set(targetExisting.map((e) => e.studentId));

  for (const p of promotions) {
    const stu = studentMap.get(p.studentId);
    if (!stu || stu.role !== "STUDENT") throw new ValidationError(`studentId ${p.studentId} must be an existing student at this school`);
    if (!sourceMap.has(p.studentId)) throw new ValidationError(`Student ${p.studentId} has no enrollment in source academic year`);
    if (targetSet.has(p.studentId)) throw new ConflictError(`Student ${p.studentId} already has an enrollment in target academic year`);
  }

  // Transaction: create target enrollments, mark source as COMPLETED
  const result = await prisma.$transaction(async (tx) => {
    const created: EnrollmentRow[] = [];
    for (const p of promotions) {
      const row = await tx.enrollment.create({
        data: {
          studentId: p.studentId,
          sectionId: p.targetSectionId,
          academicYearId: targetAcademicYearId,
          rollNo: p.rollNo,
          schoolId,
          status: "ACTIVE",
        },
        include: DETAIL_INCLUDE,
      });
      created.push(row);
      const src = sourceMap.get(p.studentId)!;
      if (src.status === "ACTIVE") {
        await tx.enrollment.update({ where: { id: src.id }, data: { status: "COMPLETED" } });
      }
    }
    return created;
  });

  await writeAuditLog({
    actorUserId,
    action: "enrollment.promote",
    targetSchoolId: schoolId,
    entity: "Enrollment",
    entityId: targetAcademicYearId,
    diff: { sourceAcademicYearId, targetAcademicYearId, count: promotions.length },
  });

  return result.map(toDetails);
}

export async function listCurrentEnrollments(query: Record<string, unknown>, schoolId: string) {
  // Convenience wrapper: defaults to active year and ACTIVE status
  const academicYearId =
    typeof query.academicYearId === "string"
      ? (query.academicYearId as string)
      : (await prisma.academicYear.findFirst({ where: { isActive: true } }))?.id;

  const where: Prisma.EnrollmentWhereInput = { status: "ACTIVE" as const };
  if (academicYearId) where.academicYearId = academicYearId;
  if (typeof query.sectionId === "string") where.sectionId = query.sectionId as string;
  if (typeof query.classId === "string") where.section = { classId: query.classId as string };
  if (typeof query.studentId === "string") where.studentId = query.studentId as string;

  const page = parsePagination(query);
  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({ where, include: DETAIL_INCLUDE, orderBy: { createdAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.enrollment.count({ where }),
  ]);
  return { enrollments: rows.map(toDetails), meta: paginationMeta(total, page) };
}

export async function getStudentHistory(studentId: string): Promise<EnrollmentWithDetails[]> {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") throw new NotFoundError("Student not found");
  const rows = await prisma.enrollment.findMany({
    where: { studentId },
    include: DETAIL_INCLUDE,
    orderBy: [{ academicYear: { startDate: "asc" } }, { createdAt: "asc" }],
  });
  return rows.map(toDetails);
}
