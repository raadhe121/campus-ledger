import * as staffLike from "../../lib/staffLikePeople.js";
import type { CreateStaffInput, UpdateStaffInput, PersonStatusInput } from "@campus-ledger/validation-schemas";
import type { Role } from "@campus-ledger/shared-types";

// Covers non-teaching staff — STAFF and ACCOUNTANT both share StaffProfile
// (§03) and this module's routes; TEACHER gets its own module. `role` in
// the create body picks which of the two, defaulting to STAFF; reads match
// either, since a caller listing/looking up "staff" shouldn't need to know
// which of the two roles a given person has.
const STAFF_ROLES: Role[] = ["STAFF", "ACCOUNTANT"];

export function createStaffMember(input: CreateStaffInput, actorUserId: string, schoolId: string) {
  const { role, ...profileInput } = input;
  return staffLike.createStaffLikePerson(role as Role, profileInput, actorUserId, schoolId);
}

export function listStaff(query: Record<string, unknown>) {
  return staffLike.listStaffLikePeople(STAFF_ROLES, query);
}

export function getStaffMember(userId: string) {
  return staffLike.getStaffLikePerson(STAFF_ROLES, userId);
}

export function updateStaffMember(userId: string, input: UpdateStaffInput, actorUserId: string, schoolId: string) {
  return staffLike.updateStaffLikePerson(STAFF_ROLES, userId, input, actorUserId, schoolId);
}

export function setStaffMemberStatus(userId: string, input: PersonStatusInput, actorUserId: string, schoolId: string) {
  return staffLike.setStaffLikePersonStatus(STAFF_ROLES, userId, input.status, actorUserId, schoolId);
}
