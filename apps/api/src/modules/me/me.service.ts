import type { Role } from "@campus-ledger/shared-types";
import type { SubmitAssignmentInput } from "@campus-ledger/validation-schemas";
import { prisma } from "../../lib/prisma.js";
import { ForbiddenError } from "../../lib/errors.js";
import * as studentsService from "../students/students.service.js";
import * as staffLike from "../../lib/staffLikePeople.js";
import * as enrollmentService from "../enrollment/enrollment.service.js";
import * as timetableService from "../timetable/timetable.service.js";
import * as examSubjectsService from "../exam-subjects/exam-subjects.service.js";
import * as assignmentsService from "../assignments/assignments.service.js";
import * as parentsService from "../parents/parents.service.js";
import * as studentFeesService from "../student-fees/student-fees.service.js";

/**
 * Self-service reads for the caller's own record — architecture §07's RBAC
 * matrix gives Student "R (self)" on Users & enrollment, distinct from the
 * School Admin "Manage" scope the students module otherwise requires.
 * `userId` here is always `req.user!.id` from the verified JWT, never a
 * client-supplied param, so a student can only ever see their own data —
 * this reuses the same tenant-scoped service School Admin's student
 * detail screen would call, not a parallel unscoped path.
 */
export function getMyStudentDashboard(userId: string) {
  return studentsService.getStudentHistory(userId);
}

/**
 * §07 gives Teacher "R (own)" on Users & enrollment — their own profile
 * plus the roster of whatever they're actually responsible for. Phase 02
 * has no TeachingAssignment table yet (that's a Phase 03/timetable
 * concern), so "own" here is exactly what already exists: the sections
 * where this teacher is `classTeacherId`. Each section's `prisma.section`
 * read and each roster's `listEnrollments` call are the same tenant-scoped
 * paths School Admin's screens use — never a client-supplied id, so a
 * teacher can only ever see their own sections' rosters.
 */
export async function getMyTeacherDashboard(userId: string) {
  const teacher = await staffLike.getStaffLikePerson("TEACHER", userId);

  const sections = await prisma.section.findMany({
    where: { classTeacherId: userId },
    include: { class: { include: { academicYear: true } } },
    orderBy: { name: "asc" },
  });

  const classes = await Promise.all(
    sections.map(async (section) => {
      const { enrollments } = await enrollmentService.listEnrollments({ sectionId: section.id, limit: 200 });
      return {
        id: section.id,
        name: section.name,
        roomNo: section.roomNo,
        class: { id: section.class.id, name: section.class.name },
        academicYear: { id: section.class.academicYear.id, label: section.class.academicYear.label },
        roster: enrollments.filter((e) => e.status === "ACTIVE"),
      };
    }),
  );

  return { teacher, classes };
}

/**
 * §07: Student gets "R (self)" on Attendance. Every AttendanceRecord ever
 * marked for this student, newest first, plus the summary a "your
 * attendance" screen actually leads with — computed here rather than
 * trusting a client to total percentages itself.
 */
export async function getMyAttendance(userId: string) {
  const rows = await prisma.attendanceRecord.findMany({
    where: { studentId: userId },
    include: { section: { include: { class: true } } },
    orderBy: { date: "desc" },
  });

  const records = rows.map((r) => ({
    id: r.id,
    schoolId: r.schoolId,
    studentId: r.studentId,
    sectionId: r.sectionId,
    date: r.date.toISOString().slice(0, 10),
    status: r.status,
    notes: r.notes,
    markedById: r.markedById,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    section: { id: r.section.id, name: r.section.name, className: r.section.class.name },
  }));

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;

  return {
    records,
    summary: { total, present, absent, late, excused, percentPresent: total ? Math.round(((present + late) / total) * 100) : 0 },
  };
}

/**
 * §07: Teacher gets "R (own)" and Student gets "R (self)" on Timetable —
 * a Teacher's own weekly schedule is every slot where they teach; a
 * Student's is every slot for the section their current ACTIVE enrollment
 * puts them in (empty if they haven't been enrolled yet, not an error).
 */
export async function getMyTimetable(userId: string, role: Role) {
  if (role === "TEACHER") return timetableService.listSlotsForTeacher(userId);

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: userId, status: "ACTIVE" } });
  if (!enrollment) return [];
  return timetableService.listSlotsForSection(enrollment.sectionId);
}

/**
 * §07: Student gets "R (self)" on Exams & marks — the "report card" view.
 * Every Result ever entered for this student, joined with enough
 * exam/subject/section context to render without a second lookup, plus a
 * pass/fail computed from each paper's own passMarks.
 */
export async function getMyResults(userId: string) {
  const rows = await prisma.result.findMany({
    where: { studentId: userId },
    include: { examSubject: { include: { exam: true, subject: true, section: { include: { class: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const results = rows.map((r) => ({
    id: r.id,
    schoolId: r.schoolId,
    examSubjectId: r.examSubjectId,
    studentId: r.studentId,
    marksObtained: r.marksObtained,
    grade: r.grade,
    remarks: r.remarks,
    enteredById: r.enteredById,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    examSubject: {
      id: r.examSubject.id,
      schoolId: r.examSubject.schoolId,
      examId: r.examSubject.examId,
      subjectId: r.examSubject.subjectId,
      sectionId: r.examSubject.sectionId,
      maxMarks: r.examSubject.maxMarks,
      passMarks: r.examSubject.passMarks,
      examDate: r.examSubject.examDate.toISOString(),
      createdAt: r.examSubject.createdAt.toISOString(),
      updatedAt: r.examSubject.updatedAt.toISOString(),
      exam: { id: r.examSubject.exam.id, name: r.examSubject.exam.name, type: r.examSubject.exam.type },
      subject: { id: r.examSubject.subject.id, name: r.examSubject.subject.name, code: r.examSubject.subject.code },
      section: { id: r.examSubject.section.id, name: r.examSubject.section.name, className: r.examSubject.section.class.name },
    },
  }));

  return {
    results,
    passCount: results.filter((r) => r.marksObtained >= r.examSubject.passMarks).length,
    failCount: results.filter((r) => r.marksObtained < r.examSubject.passMarks).length,
  };
}

/** §07: Teacher's own exam subjects — those for a subject+section they actually teach, per their TimetableSlots. Delegates straight to exam-subjects.service so there's one implementation of "own subject", shared with marks entry's ownership check. */
export function getMyExamSubjects(userId: string) {
  return examSubjectsService.listMyExamSubjects(userId);
}

/** §07: Student's own assignments — those set for their current section, each joined with their own submission if they've made one. */
export function getMyAssignments(userId: string) {
  return assignmentsService.listMyAssignments(userId);
}

/** §07: Student's "+ submit" on Assignments — always writes as the caller, never a client-supplied studentId. */
export function submitMyAssignment(assignmentId: string, input: SubmitAssignmentInput, userId: string, schoolId: string) {
  return assignmentsService.submitAssignment(assignmentId, input, userId, schoolId);
}

/** §07: Student's own "R (self)" on Fees & payments — every charge assigned to them, read-only; recording a payment stays Accountant/School-Admin-only under /payments. */
export function getMyFees(userId: string) {
  return studentFeesService.listMyFees(userId);
}

// ---------------------------------------------------------------------------
// §07: Parent gets "R (children)" across Users & enrollment, Attendance,
// Timetable, Exams & marks, and Assignments — the same five reads a
// Student gets for themselves, just fanned out across every linked child
// instead of hardcoded to the caller's own id. Every one of them reuses
// the exact same service function a Student's own /me/* route calls —
// there's no separate "parent view" implementation to drift out of sync,
// only the ownership check below deciding whose data a given call reaches.
// ---------------------------------------------------------------------------

/** A parent can only ever reach a child actually linked to them via ParentStudent — checked before every one of the reads below, not assumed from the role check alone. */
async function assertParentOfStudent(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findFirst({ where: { parentId, studentId } });
  if (!link) throw new ForbiddenError("This student isn't linked to your account");
}

/** Every student linked to this parent — the "which child" a Parent's screens all start from. */
export function getMyChildren(parentId: string) {
  return parentsService.listChildren(parentId);
}

export async function getChildDashboard(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyStudentDashboard(studentId);
}

export async function getChildAttendance(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyAttendance(studentId);
}

export async function getChildTimetable(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyTimetable(studentId, "STUDENT");
}

export async function getChildResults(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyResults(studentId);
}

export async function getChildAssignments(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyAssignments(studentId);
}

export async function getChildFees(parentId: string, studentId: string) {
  await assertParentOfStudent(parentId, studentId);
  return getMyFees(studentId);
}
