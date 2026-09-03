import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { provisionSchoolUser } from "../../lib/provisionUser.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";
import { toPublicUser } from "../users/user.mapper.js";
import type { CreateParentInput, UpdateParentInput, PersonStatusInput, LinkParentStudentInput } from "@campus-ledger/validation-schemas";
import type { PublicUser, ParentStudentLinkWithStudent } from "@campus-ledger/shared-types";

// No profile table for PARENT (§03) — it's a plain User plus its
// ParentStudent links, which is why this module is noticeably shorter than
// students/staff.

async function findParentOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "PARENT") throw new NotFoundError("Parent not found");
  return user;
}

export async function createParent(input: CreateParentInput, actorUserId: string, schoolId: string): Promise<{ user: PublicUser; tempPassword: string }> {
  const { user, tempPassword } = await provisionSchoolUser("PARENT", input);

  await writeAuditLog({ actorUserId, action: "parent.create", targetSchoolId: schoolId, entity: "User", entityId: user.id });

  return { user: toPublicUser(user), tempPassword };
}

export async function listParents(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const where = { role: "PARENT" as const };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.user.count({ where }),
  ]);

  return { parents: rows.map(toPublicUser), meta: paginationMeta(total, page) };
}

export async function getParent(userId: string): Promise<PublicUser> {
  return toPublicUser(await findParentOrThrow(userId));
}

export async function updateParent(userId: string, input: UpdateParentInput, actorUserId: string, schoolId: string): Promise<PublicUser> {
  await findParentOrThrow(userId);
  const user = await prisma.user.update({ where: { id: userId }, data: input });

  await writeAuditLog({ actorUserId, action: "parent.update", targetSchoolId: schoolId, entity: "User", entityId: userId, diff: input });

  return toPublicUser(user);
}

export async function setParentStatus(userId: string, input: PersonStatusInput, actorUserId: string, schoolId: string): Promise<PublicUser> {
  await findParentOrThrow(userId);

  const user = await prisma.user.update({
    where: { id: userId },
    data: input.status === "DISABLED" ? { status: input.status, tokenVersion: { increment: 1 } } : { status: input.status },
  });

  await writeAuditLog({
    actorUserId,
    action: "parent.status_change",
    targetSchoolId: schoolId,
    entity: "User",
    entityId: userId,
    diff: { status: input.status },
  });

  return toPublicUser(user);
}

export async function listChildren(parentId: string): Promise<ParentStudentLinkWithStudent[]> {
  await findParentOrThrow(parentId);

  const links = await prisma.parentStudent.findMany({ where: { parentId }, include: { student: true }, orderBy: { createdAt: "asc" } });

  return links.map((link) => ({
    id: link.id,
    schoolId: link.schoolId,
    parentId: link.parentId,
    studentId: link.studentId,
    relation: link.relation,
    isPrimaryGuardian: link.isPrimaryGuardian,
    createdAt: link.createdAt.toISOString(),
    student: toPublicUser(link.student),
  }));
}

export async function linkChild(parentId: string, input: LinkParentStudentInput, actorUserId: string, schoolId: string) {
  await findParentOrThrow(parentId);

  const student = await prisma.user.findUnique({ where: { id: input.studentId } });
  if (!student || student.role !== "STUDENT") throw new ValidationError("studentId must be an existing student at this school");

  const existing = await prisma.parentStudent.findFirst({ where: { parentId, studentId: input.studentId } });
  if (existing) throw new ConflictError("This parent is already linked to this student");

  const link = await prisma.parentStudent.create({
    data: { parentId, studentId: input.studentId, schoolId, relation: input.relation, isPrimaryGuardian: input.isPrimaryGuardian ?? false },
  });

  await writeAuditLog({ actorUserId, action: "parent.link_child", targetSchoolId: schoolId, entity: "ParentStudent", entityId: link.id });

  return {
    id: link.id,
    schoolId: link.schoolId,
    parentId: link.parentId,
    studentId: link.studentId,
    relation: link.relation,
    isPrimaryGuardian: link.isPrimaryGuardian,
    createdAt: link.createdAt.toISOString(),
    student: toPublicUser(student),
  } satisfies ParentStudentLinkWithStudent;
}

export async function unlinkChild(parentId: string, linkId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findParentOrThrow(parentId);

  const link = await prisma.parentStudent.findUnique({ where: { id: linkId } });
  if (!link || link.parentId !== parentId) throw new NotFoundError("Link not found");

  await prisma.parentStudent.delete({ where: { id: linkId } });

  await writeAuditLog({ actorUserId, action: "parent.unlink_child", targetSchoolId: schoolId, entity: "ParentStudent", entityId: linkId });
}
