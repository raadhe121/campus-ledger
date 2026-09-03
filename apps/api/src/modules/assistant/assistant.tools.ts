import type { Role } from "@campus-ledger/shared-types";
import { prisma } from "../../lib/prisma.js";
import * as meService from "../me/me.service.js";
import * as parentsService from "../parents/parents.service.js";
import * as assignmentsService from "../assignments/assignments.service.js";
import * as staffLike from "../../lib/staffLikePeople.js";
import * as studentsService from "../students/students.service.js";
import * as teachersService from "../teachers/teachers.service.js";
import * as academicYearsService from "../academic-years/academic-years.service.js";
import * as studentFeesService from "../student-fees/student-fees.service.js";
import * as paymentsService from "../payments/payments.service.js";
import * as expensesService from "../expenses/expenses.service.js";
import * as feeStructuresService from "../fee-structures/fee-structures.service.js";
import * as schoolsService from "../schools/schools.service.js";

export interface ToolContext {
  userId: string;
  role: Role;
  schoolId: string | null;
}

/** Plain JSON Schema — the shape Groq's OpenAI-compatible `tools[].function.parameters` field expects (assistant.service.ts wraps these at request time). */
type ToolParameters = { type: "object"; properties: Record<string, unknown>; required?: string[] };

export interface AssistantTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  /** Shown in the widget while this tool runs — a small "what am I doing right now" signal. */
  statusLabel: string;
  handler: (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

const NO_ARGS: ToolParameters = { type: "object", properties: {} };

function tool(name: string, description: string, statusLabel: string, parameters: ToolParameters, handler: AssistantTool["handler"]): AssistantTool {
  return { name, description, parameters, statusLabel, handler };
}

// ---------------------------------------------------------------------------
// Every tool here is read-only and reads exactly what the signed-in user
// could already see through the app's own screens — never more. Identity
// (userId/schoolId) always comes from `ctx`, which is built server-side
// from the verified JWT (see assistant.controller.ts), never from a
// model-supplied argument; the only ids a tool ever takes from the model
// are ones the *service layer itself* re-checks for ownership (a Parent's
// studentId, re-verified against ParentStudent by meService.getChild*).
// Running inside the same authenticated + tenant-scoped request pipeline
// as every other route means these calls inherit §06's tenant isolation
// for free — there is no separate "assistant data access" path to drift
// out of sync with the real one.
// ---------------------------------------------------------------------------

const STUDENT_TOOLS: AssistantTool[] = [
  tool("get_my_profile", "The caller's own student profile, admission info, and enrollment history.", "Checking your profile…", NO_ARGS, (_i, ctx) =>
    meService.getMyStudentDashboard(ctx.userId),
  ),
  tool("get_my_attendance", "The caller's own attendance records and running summary (present/absent/late/excused).", "Checking your attendance…", NO_ARGS, (_i, ctx) =>
    meService.getMyAttendance(ctx.userId),
  ),
  tool("get_my_timetable", "The caller's own weekly class timetable.", "Checking your timetable…", NO_ARGS, (_i, ctx) => meService.getMyTimetable(ctx.userId, "STUDENT")),
  tool("get_my_results", "The caller's own exam results across every exam — their report card.", "Checking your results…", NO_ARGS, (_i, ctx) => meService.getMyResults(ctx.userId)),
  tool("get_my_assignments", "Assignments posted for the caller's section, each with their own submission/grade if any.", "Checking your assignments…", NO_ARGS, (_i, ctx) =>
    meService.getMyAssignments(ctx.userId),
  ),
  tool("get_my_fees", "The caller's own fee charges — amount due, amount paid, status, due dates.", "Checking your fees…", NO_ARGS, (_i, ctx) => meService.getMyFees(ctx.userId)),
];

const TEACHER_TOOLS: AssistantTool[] = [
  tool("get_my_profile_and_classes", "The caller's own teacher profile and every section where they're the class teacher, with rosters.", "Checking your classes…", NO_ARGS, (_i, ctx) =>
    meService.getMyTeacherDashboard(ctx.userId),
  ),
  tool("get_my_timetable", "The caller's own weekly teaching timetable.", "Checking your timetable…", NO_ARGS, (_i, ctx) => meService.getMyTimetable(ctx.userId, "TEACHER")),
  tool("get_my_exam_subjects", "Exam papers for subjects/sections the caller actually teaches.", "Checking your exam subjects…", NO_ARGS, (_i, ctx) =>
    meService.getMyExamSubjects(ctx.userId),
  ),
  tool("get_my_assignments", "Assignments the caller has posted.", "Checking your assignments…", NO_ARGS, async (_i, ctx) => {
    const { assignments } = await assignmentsService.listAssignments({ limit: 50 }, ctx.role, ctx.userId);
    return assignments;
  }),
];

const PARENT_TOOLS: AssistantTool[] = [
  tool("get_my_children", "Every student linked to the caller's account — the id/name each child-scoped tool below needs.", "Checking your children…", NO_ARGS, (_i, ctx) =>
    parentsService.listChildren(ctx.userId),
  ),
  childTool("get_child_attendance", "One linked child's attendance records and summary.", "Checking their attendance…", meService.getChildAttendance),
  childTool("get_child_timetable", "One linked child's weekly class timetable.", "Checking their timetable…", meService.getChildTimetable),
  childTool("get_child_results", "One linked child's exam results — their report card.", "Checking their results…", meService.getChildResults),
  childTool("get_child_assignments", "One linked child's assignments and submissions.", "Checking their assignments…", meService.getChildAssignments),
  childTool("get_child_fees", "One linked child's fee charges — amount due, amount paid, status.", "Checking their fees…", meService.getChildFees),
];

function childTool(name: string, description: string, statusLabel: string, fn: (parentId: string, studentId: string) => Promise<unknown>): AssistantTool {
  return tool(
    name,
    `${description} Ownership is re-checked server-side — call get_my_children first if you don't already have the studentId.`,
    statusLabel,
    { type: "object", properties: { studentId: { type: "string", description: "The child's user id, from get_my_children." } }, required: ["studentId"] },
    (input, ctx) => fn(ctx.userId, String(input.studentId ?? "")),
  );
}

const STAFF_TOOLS: AssistantTool[] = [
  tool("get_my_profile", "The caller's own staff profile (designation, department, joining date).", "Checking your profile…", NO_ARGS, (_i, ctx) =>
    staffLike.getStaffLikePerson("STAFF", ctx.userId),
  ),
];

async function getSchoolOverview() {
  const [studentCount, teacherCount, classCount, activeYear] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.class.count(),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
  ]);
  return { studentCount, teacherCount, classCount, activeAcademicYear: activeYear?.label ?? null };
}

const SCHOOL_ADMIN_TOOLS: AssistantTool[] = [
  tool("get_school_overview", "Headline counts for the school: students, teachers, classes, and the active academic year.", "Checking the school overview…", NO_ARGS, getSchoolOverview),
  tool(
    "list_students",
    "Search/list students by name, email, or admission number.",
    "Looking up students…",
    { type: "object", properties: { search: { type: "string", description: "Optional name/email/admission-no search." } } },
    async (input) => (await studentsService.listStudents({ search: input.search, limit: 20 })).students,
  ),
  tool("list_teachers", "List teachers at the school.", "Looking up teachers…", NO_ARGS, async () => (await teachersService.listTeachers({ limit: 20 })).people),
  tool("list_academic_years", "List the school's academic years and which one is active.", "Checking academic years…", NO_ARGS, async () => (await academicYearsService.listAcademicYears({})).years),
  tool(
    "list_student_fees",
    "Browse student fee charges, optionally filtered by status.",
    "Checking student fees…",
    { type: "object", properties: { status: { type: "string", enum: ["PENDING", "PARTIAL", "PAID"], description: "Optional status filter." } } },
    async (input) => (await studentFeesService.listStudentFees({ status: input.status, limit: 20 })).studentFees,
  ),
  tool("list_expenses", "Recent school expenses.", "Checking expenses…", NO_ARGS, async () => (await expensesService.listExpenses({ limit: 20 })).expenses),
];

const ACCOUNTANT_TOOLS: AssistantTool[] = [
  tool(
    "list_student_fees",
    "Browse student fee charges, optionally filtered by status.",
    "Checking student fees…",
    { type: "object", properties: { status: { type: "string", enum: ["PENDING", "PARTIAL", "PAID"], description: "Optional status filter." } } },
    async (input) => (await studentFeesService.listStudentFees({ status: input.status, limit: 20 })).studentFees,
  ),
  tool(
    "list_payments",
    "Recently recorded payments, optionally for one student fee charge.",
    "Checking payments…",
    { type: "object", properties: { studentFeeId: { type: "string", description: "Optional — limit to one student fee's payments." } } },
    async (input) => (await paymentsService.listPayments({ studentFeeId: input.studentFeeId, limit: 20 })).payments,
  ),
  tool("list_expenses", "Recent school expenses.", "Checking expenses…", NO_ARGS, async () => (await expensesService.listExpenses({ limit: 20 })).expenses),
  tool("list_fee_structures", "Fee structures and their line items.", "Checking fee structures…", NO_ARGS, async () => (await feeStructuresService.listFeeStructures({ limit: 20 })).feeStructures),
];

const SUPER_ADMIN_TOOLS: AssistantTool[] = [
  tool("list_schools", "List every school on the platform, optionally filtered by status.", "Checking schools…", {
    type: "object",
    properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], description: "Optional status filter." } },
  }, async (input) => (await schoolsService.listSchools({ status: input.status, limit: 20 })).schools),
];

export function getToolsForRole(role: Role): AssistantTool[] {
  switch (role) {
    case "STUDENT":
      return STUDENT_TOOLS;
    case "TEACHER":
      return TEACHER_TOOLS;
    case "PARENT":
      return PARENT_TOOLS;
    case "STAFF":
      return STAFF_TOOLS;
    case "SCHOOL_ADMIN":
      return SCHOOL_ADMIN_TOOLS;
    case "ACCOUNTANT":
      return ACCOUNTANT_TOOLS;
    case "SUPER_ADMIN":
      return SUPER_ADMIN_TOOLS;
    default:
      return [];
  }
}
