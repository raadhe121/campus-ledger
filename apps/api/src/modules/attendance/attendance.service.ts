import type { Prisma } from "@prisma/client";
import type { Role } from "@campus-ledger/shared-types";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import type { MarkAttendanceInput, UpdateAttendanceRecordInput } from "@campus-ledger/validation-schemas";
import type { AttendanceRecord, AttendanceRosterEntry } from "@campus-ledger/shared-types";

function toPublic(row: Prisma.AttendanceRecordGetPayload<object>): AttendanceRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    studentId: row.studentId,
    sectionId: row.sectionId,
    date: row.date.toISOString().slice(0, 10),
    status: row.status,
    notes: row.notes,
    markedById: row.markedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** §07: a Teacher's attendance access is scoped to sections they're the class teacher of; School Admin's "Manage" isn't scoped beyond the tenant boundary already enforced by lib/prisma.ts. */
async function assertSectionAccess(sectionId: string, actorRole: Role, actorId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) throw new NotFoundError("Section not found");
  if (actorRole === "TEACHER" && section.classTeacherId !== actorId) {
    throw new ForbiddenError("You're not the class teacher for this section");
  }
  return section;
}

/** The Mark Attendance screen's data source — every actively-enrolled student in the section, joined with today's record if one already exists. */
export async function getRoster(sectionId: string, date: Date, actorRole: Role, actorId: string): Promise<AttendanceRosterEntry[]> {
  await assertSectionAccess(sectionId, actorRole, actorId);

  const dayStart = toDayStart(date);
  const [enrollments, records] = await Promise.all([
    prisma.enrollment.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { student: { include: { studentProfile: true } } },
      orderBy: { rollNo: "asc" },
    }),
    prisma.attendanceRecord.findMany({ where: { sectionId, date: dayStart } }),
  ]);

  const byStudent = new Map(records.map((r) => [r.studentId, r]));

  return enrollments
    .filter((e) => e.student.studentProfile)
    .map((e) => ({
      studentId: e.studentId,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      admissionNo: e.student.studentProfile!.admissionNo,
      rollNo: e.rollNo,
      record: byStudent.has(e.studentId) ? toPublic(byStudent.get(e.studentId)!) : null,
    }));
}

/** One bulk upsert per section per date — re-marking a date updates each student's existing row rather than creating a duplicate (the studentId+date unique constraint is what makes that safe). */
export async function markAttendance(input: MarkAttendanceInput, actorUserId: string, actorRole: Role, schoolId: string): Promise<AttendanceRecord[]> {
  await assertSectionAccess(input.sectionId, actorRole, actorUserId);

  const activeIds = new Set(
    (await prisma.enrollment.findMany({ where: { sectionId: input.sectionId, status: "ACTIVE" }, select: { studentId: true } })).map((e) => e.studentId),
  );
  for (const record of input.records) {
    if (!activeIds.has(record.studentId)) throw new ValidationError(`Student ${record.studentId} is not actively enrolled in this section`);
  }

  const dayStart = toDayStart(input.date);

  const results = await prisma.$transaction(
    input.records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: r.studentId, date: dayStart } },
        create: { schoolId, studentId: r.studentId, sectionId: input.sectionId, date: dayStart, status: r.status, notes: r.notes, markedById: actorUserId },
        update: { status: r.status, notes: r.notes ?? null, sectionId: input.sectionId, markedById: actorUserId },
      }),
    ),
  );

  await writeAuditLog({
    actorUserId,
    action: "attendance.mark",
    targetSchoolId: schoolId,
    entity: "Section",
    entityId: input.sectionId,
    diff: { date: dayStart.toISOString().slice(0, 10), count: input.records.length },
  });

  return results.map(toPublic);
}

export async function updateAttendanceRecord(
  recordId: string,
  input: UpdateAttendanceRecordInput,
  actorUserId: string,
  actorRole: Role,
  schoolId: string,
): Promise<AttendanceRecord> {
  const existing = await prisma.attendanceRecord.findUnique({ where: { id: recordId } });
  if (!existing) throw new NotFoundError("Attendance record not found");
  await assertSectionAccess(existing.sectionId, actorRole, actorUserId);

  const updated = await prisma.attendanceRecord.update({ where: { id: recordId }, data: input });

  await writeAuditLog({ actorUserId, action: "attendance.update", targetSchoolId: schoolId, entity: "AttendanceRecord", entityId: recordId, diff: input });

  return toPublic(updated);
}
