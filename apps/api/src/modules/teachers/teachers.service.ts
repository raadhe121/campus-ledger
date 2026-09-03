import * as staffLike from "../../lib/staffLikePeople.js";
import type { CreateTeacherInput, UpdateTeacherInput, PersonStatusInput } from "@campus-ledger/validation-schemas";

// TEACHER shares StaffProfile with ACCOUNTANT/STAFF (§03) — this module
// just fixes the role for lib/staffLikePeople.ts's generic CRUD.

export function createTeacher(input: CreateTeacherInput, actorUserId: string, schoolId: string) {
  return staffLike.createStaffLikePerson("TEACHER", input, actorUserId, schoolId);
}

export function listTeachers(query: Record<string, unknown>) {
  return staffLike.listStaffLikePeople("TEACHER", query);
}

export function getTeacher(userId: string) {
  return staffLike.getStaffLikePerson("TEACHER", userId);
}

export function updateTeacher(userId: string, input: UpdateTeacherInput, actorUserId: string, schoolId: string) {
  return staffLike.updateStaffLikePerson("TEACHER", userId, input, actorUserId, schoolId);
}

export function setTeacherStatus(userId: string, input: PersonStatusInput, actorUserId: string, schoolId: string) {
  return staffLike.setStaffLikePersonStatus("TEACHER", userId, input.status, actorUserId, schoolId);
}
