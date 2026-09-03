import type { StaffProfile, User } from "@prisma/client";
import { prisma } from "./prisma.js";
import { NotFoundError } from "./errors.js";
import { writeAuditLog } from "./audit.js";
import { provisionSchoolUser } from "./provisionUser.js";
import { parsePagination, paginationMeta, type PageParams } from "./pagination.js";
import { toPublicUser } from "../modules/users/user.mapper.js";
import type { Role, StaffWithProfile } from "@campus-ledger/shared-types";

/**
 * TEACHER, ACCOUNTANT and STAFF are three roles sharing one profile table
 * (§03/§04 — "one table, seven roles" applied one level down to
 * StaffProfile). This is the CRUD those three roles' modules
 * (teachers.service.ts, staff.service.ts) all call into with their own
 * fixed/allowed `role` value, rather than duplicating the same five
 * functions three times.
 */

interface StaffProfileFields {
  designation?: string;
  department?: string;
  joiningDate?: Date;
}

interface CreateStaffLikeInput extends StaffProfileFields {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

function toStaffWithProfile(user: User, profile: StaffProfile): StaffWithProfile {
  return {
    user: toPublicUser(user),
    profile: {
      id: profile.id,
      schoolId: profile.schoolId,
      userId: profile.userId,
      designation: profile.designation,
      department: profile.department,
      joiningDate: profile.joiningDate.toISOString(),
    },
  };
}

export async function createStaffLikePerson(
  role: Role,
  input: CreateStaffLikeInput,
  actorUserId: string,
  schoolId: string,
): Promise<{ result: StaffWithProfile; tempPassword: string }> {
  const { designation, department, joiningDate, ...personInput } = input;
  const { user, tempPassword } = await provisionSchoolUser(role, personInput);
  const profile = await prisma.staffProfile.create({ data: { userId: user.id, schoolId, designation, department, joiningDate } });

  await writeAuditLog({ actorUserId, action: `${role.toLowerCase()}.create`, targetSchoolId: schoolId, entity: "User", entityId: user.id });

  return { result: toStaffWithProfile(user, profile), tempPassword };
}

export async function listStaffLikePeople(roles: Role | Role[], query: Record<string, unknown>) {
  const page: PageParams = parsePagination(query);
  const where = { role: Array.isArray(roles) ? { in: roles } : roles };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { staffProfile: true },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    people: rows.filter((r) => r.staffProfile).map((r) => toStaffWithProfile(r, r.staffProfile!)),
    meta: paginationMeta(total, page),
  };
}

async function findStaffLikeOrThrow(roles: Role | Role[], userId: string) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true } });
  if (!user || !allowed.includes(user.role) || !user.staffProfile) throw new NotFoundError("Not found");
  return { user, profile: user.staffProfile };
}

export async function getStaffLikePerson(roles: Role | Role[], userId: string): Promise<StaffWithProfile> {
  const { user, profile } = await findStaffLikeOrThrow(roles, userId);
  return toStaffWithProfile(user, profile);
}

export async function updateStaffLikePerson(
  roles: Role | Role[],
  userId: string,
  input: { firstName?: string; lastName?: string; phone?: string } & StaffProfileFields,
  actorUserId: string,
  schoolId: string,
): Promise<StaffWithProfile> {
  const { firstName, lastName, phone, designation, department } = input;
  const { user: existing, profile } = await findStaffLikeOrThrow(roles, userId);

  const [user, updatedProfile] = await Promise.all([
    prisma.user.update({ where: { id: userId }, data: { firstName, lastName, phone } }),
    prisma.staffProfile.update({ where: { id: profile.id }, data: { designation, department } }),
  ]);

  await writeAuditLog({
    actorUserId,
    action: `${existing.role.toLowerCase()}.update`,
    targetSchoolId: schoolId,
    entity: "User",
    entityId: userId,
    diff: input,
  });

  return toStaffWithProfile(user, updatedProfile);
}

/** Deactivate/reactivate rather than delete — consistent with how every other role in this app is retired (§05's `status`/`tokenVersion`, schools.service.ts's status endpoint). */
export async function setStaffLikePersonStatus(
  roles: Role | Role[],
  userId: string,
  status: "ACTIVE" | "DISABLED",
  actorUserId: string,
  schoolId: string,
): Promise<StaffWithProfile> {
  const { user: existing, profile } = await findStaffLikeOrThrow(roles, userId);

  // Only DISABLED needs the forced-logout bump (§05) — reactivating to
  // ACTIVE doesn't need to invalidate anything, since a disabled account's
  // tokens are already rejected by `authenticate`'s status check.
  const user = await prisma.user.update({
    where: { id: userId },
    data: status === "DISABLED" ? { status, tokenVersion: { increment: 1 } } : { status },
  });

  await writeAuditLog({
    actorUserId,
    action: `${existing.role.toLowerCase()}.status_change`,
    targetSchoolId: schoolId,
    entity: "User",
    entityId: userId,
    diff: { status },
  });

  return toStaffWithProfile(user, profile);
}
