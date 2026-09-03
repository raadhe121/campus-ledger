import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import type { CreateTimetableSlotInput, UpdateTimetableSlotInput } from "@campus-ledger/validation-schemas";
import type { TimetableSlotWithDetails } from "@campus-ledger/shared-types";

// The include shape every read below joins in, so a schedule screen never
// needs a second round trip for the section/subject/teacher's name.
const DETAIL_INCLUDE = {
  section: { include: { class: true } },
  subject: true,
  teacher: true,
} as const;

type SlotRow = Prisma.TimetableSlotGetPayload<{ include: typeof DETAIL_INCLUDE }>;

function toDetails(row: SlotRow): TimetableSlotWithDetails {
  return {
    id: row.id,
    schoolId: row.schoolId,
    sectionId: row.sectionId,
    subjectId: row.subjectId,
    teacherId: row.teacherId,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    section: { id: row.section.id, name: row.section.name, className: row.section.class.name },
    subject: { id: row.subject.id, name: row.subject.name, code: row.subject.code },
    teacher: { id: row.teacher.id, firstName: row.teacher.firstName, lastName: row.teacher.lastName },
  };
}

async function assertValidTeacher(teacherId: string) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER") throw new ValidationError("teacherId must be an existing teacher at this school");
}

/** A section and a teacher can each only be in one place at a time — checked on every create/update, not just left to a unique index that can't express "overlapping", not merely "equal". */
async function assertNoOverlap(
  input: { sectionId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string },
  excludeId?: string,
) {
  const candidates = await prisma.timetableSlot.findMany({
    where: { dayOfWeek: input.dayOfWeek, id: excludeId ? { not: excludeId } : undefined, OR: [{ sectionId: input.sectionId }, { teacherId: input.teacherId }] },
  });

  const overlap = candidates.find((c) => input.startTime < c.endTime && c.startTime < input.endTime);
  if (overlap) {
    const reason = overlap.sectionId === input.sectionId ? "This section" : "This teacher";
    throw new ConflictError(`${reason} already has a timetable slot overlapping this time on this day`);
  }
}

export async function createTimetableSlot(input: CreateTimetableSlotInput, actorUserId: string, schoolId: string): Promise<TimetableSlotWithDetails> {
  const section = await prisma.section.findUnique({ where: { id: input.sectionId } });
  if (!section) throw new NotFoundError("Section not found");

  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) throw new NotFoundError("Subject not found");

  await assertValidTeacher(input.teacherId);
  await assertNoOverlap(input);

  const slot = await prisma.timetableSlot.create({ data: { ...input, schoolId }, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "timetable.create", targetSchoolId: schoolId, entity: "TimetableSlot", entityId: slot.id });

  return toDetails(slot);
}

export async function listTimetableSlots(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where: Prisma.TimetableSlotWhereInput = {};
  if (typeof query.sectionId === "string") where.sectionId = query.sectionId;
  if (typeof query.teacherId === "string") where.teacherId = query.teacherId;
  if (typeof query.dayOfWeek === "string" && query.dayOfWeek !== "") where.dayOfWeek = Number(query.dayOfWeek);

  const [rows, total] = await Promise.all([
    prisma.timetableSlot.findMany({
      where,
      include: DETAIL_INCLUDE,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      skip: page.skip,
      take: page.limit,
    }),
    prisma.timetableSlot.count({ where }),
  ]);

  return { slots: rows.map(toDetails), meta: paginationMeta(total, page) };
}

async function findSlotOrThrow(slotId: string) {
  const slot = await prisma.timetableSlot.findUnique({ where: { id: slotId }, include: DETAIL_INCLUDE });
  if (!slot) throw new NotFoundError("Timetable slot not found");
  return slot;
}

export async function getTimetableSlot(slotId: string): Promise<TimetableSlotWithDetails> {
  return toDetails(await findSlotOrThrow(slotId));
}

export async function updateTimetableSlot(
  slotId: string,
  input: UpdateTimetableSlotInput,
  actorUserId: string,
  schoolId: string,
): Promise<TimetableSlotWithDetails> {
  const existing = await findSlotOrThrow(slotId);

  if (input.teacherId) await assertValidTeacher(input.teacherId);
  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw new NotFoundError("Subject not found");
  }

  await assertNoOverlap(
    {
      sectionId: existing.sectionId,
      teacherId: input.teacherId ?? existing.teacherId,
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      startTime: input.startTime ?? existing.startTime,
      endTime: input.endTime ?? existing.endTime,
    },
    slotId,
  );

  const slot = await prisma.timetableSlot.update({ where: { id: slotId }, data: input, include: DETAIL_INCLUDE });

  await writeAuditLog({ actorUserId, action: "timetable.update", targetSchoolId: schoolId, entity: "TimetableSlot", entityId: slotId, diff: input });

  return toDetails(slot);
}

export async function deleteTimetableSlot(slotId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findSlotOrThrow(slotId);
  await prisma.timetableSlot.delete({ where: { id: slotId } });

  await writeAuditLog({ actorUserId, action: "timetable.delete", targetSchoolId: schoolId, entity: "TimetableSlot", entityId: slotId });
}

// ---- Self-scoped reads, called from modules/me (§07: Teacher "R (own)", Student "R (self)") ----

export async function listSlotsForSection(sectionId: string): Promise<TimetableSlotWithDetails[]> {
  const rows = await prisma.timetableSlot.findMany({
    where: { sectionId },
    include: DETAIL_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toDetails);
}

export async function listSlotsForTeacher(teacherId: string): Promise<TimetableSlotWithDetails[]> {
  const rows = await prisma.timetableSlot.findMany({
    where: { teacherId },
    include: DETAIL_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toDetails);
}
