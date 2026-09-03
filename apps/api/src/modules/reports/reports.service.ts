import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

const TREND_MONTHS = 6;
const ATTENDANCE_WINDOW_DAYS = 30;

interface Point {
  label: string;
  value: number;
}

/** The last N calendar months, oldest first — the common x-axis every trend chart in this module shares. */
function monthBuckets(n: number): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    buckets.push({ label: start.toLocaleDateString("en-US", { month: "short" }), start, end });
  }
  return buckets;
}

function bucketByMonth<T>(rows: T[], dateOf: (row: T) => Date, buckets: { label: string; start: Date; end: Date }[], valueOf: (row: T) => number): Point[] {
  return buckets.map((b) => ({
    label: b.label,
    value: rows.filter((r) => dateOf(r) >= b.start && dateOf(r) < b.end).reduce((sum, r) => sum + valueOf(r), 0),
  }));
}

function attendanceRate(records: { status: string }[]): number | null {
  if (records.length === 0) return null;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return Math.round((present / records.length) * 100);
}

// ---------------------------------------------------------------------------
// §07 Reports row: SUPER_ADMIN gets "R (all schools)" — the two functions
// below are the only ones in this module never scoped by tenant context
// (SUPER_ADMIN's own null schoolId already leaves Prisma's tenant-scoping
// extension a no-op, §06), so every query here filters explicitly rather
// than relying on that bypass alone.
// ---------------------------------------------------------------------------

/** The platform-wide picture Super Admin's Reports page leads with. */
export async function getPlatformReport() {
  const [schoolsByStatus, totalStudents, totalTeachers, totalParents, totalStaff, schools, studentsBySchool] = await Promise.all([
    prisma.school.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: { in: ["STAFF", "ACCOUNTANT"] } } }),
    prisma.school.findMany({ select: { id: true, name: true, createdAt: true } }),
    prisma.user.groupBy({ by: ["schoolId"], where: { role: "STUDENT" }, _count: true }),
  ]);

  const buckets = monthBuckets(TREND_MONTHS);
  const schoolsByMonth = bucketByMonth(schools, (s) => s.createdAt, buckets, () => 1);

  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));
  const topSchoolsByEnrollment = studentsBySchool
    .filter((row) => row.schoolId)
    .map((row) => ({ label: schoolNameById.get(row.schoolId!) ?? "—", value: row._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    totalSchools: schools.length,
    schoolsByStatus: {
      ACTIVE: schoolsByStatus.find((s) => s.status === "ACTIVE")?._count ?? 0,
      INACTIVE: schoolsByStatus.find((s) => s.status === "INACTIVE")?._count ?? 0,
      SUSPENDED: schoolsByStatus.find((s) => s.status === "SUSPENDED")?._count ?? 0,
    },
    totalStudents,
    totalTeachers,
    totalParents,
    totalStaff,
    schoolsByMonth,
    topSchoolsByEnrollment,
  };
}

/** One school's aggregate statistics for Super Admin — counts and totals only, never a roster; that stays behind the school's own tenant boundary. */
export async function getSchoolStatsReport(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new NotFoundError("School not found");

  const [studentCount, teacherCount, parentCount, staffCount, classCount, sectionCount, activeYear, feeAgg, expenseAgg] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
    prisma.user.count({ where: { schoolId, role: "TEACHER" } }),
    prisma.user.count({ where: { schoolId, role: "PARENT" } }),
    prisma.user.count({ where: { schoolId, role: { in: ["STAFF", "ACCOUNTANT"] } } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.section.count({ where: { schoolId } }),
    prisma.academicYear.findFirst({ where: { schoolId, isActive: true } }),
    prisma.studentFee.aggregate({ where: { schoolId }, _sum: { amountDue: true, amountPaid: true } }),
    prisma.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
  ]);

  const since = new Date(Date.now() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const attendanceRecords = await prisma.attendanceRecord.findMany({ where: { schoolId, date: { gte: since } }, select: { status: true } });

  return {
    school: { id: school.id, name: school.name, status: school.status, plan: school.plan, createdAt: school.createdAt.toISOString() },
    people: { students: studentCount, teachers: teacherCount, parents: parentCount, staff: staffCount },
    academics: { classes: classCount, sections: sectionCount, activeAcademicYear: activeYear?.label ?? null },
    attendanceRateLast30Days: attendanceRate(attendanceRecords),
    finance: {
      totalDue: feeAgg._sum.amountDue ?? 0,
      totalCollected: feeAgg._sum.amountPaid ?? 0,
      totalExpenses: expenseAgg._sum.amount ?? 0,
    },
  };
}

/** School Admin's own-school report (§07 "R (own school)") — tenant-scoped automatically, same as every other School Admin route. */
export async function getSchoolReport() {
  const [enrollments, teacherCount, parentCount, staffCount, activeYear, attendanceRecords, results, assignments, feeAgg, overdueCount] = await Promise.all([
    prisma.enrollment.findMany({ where: { status: "ACTIVE" }, include: { section: { include: { class: true } } } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: { in: ["STAFF", "ACCOUNTANT"] } } }),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
    prisma.attendanceRecord.findMany({ where: { date: { gte: new Date(Date.now() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000) } }, select: { status: true } }),
    prisma.result.findMany({ include: { examSubject: true } }),
    prisma.assignment.findMany({ include: { submissions: true } }),
    prisma.studentFee.aggregate({ _sum: { amountDue: true, amountPaid: true } }),
    prisma.studentFee.count({ where: { status: { not: "PAID" }, feeItem: { dueDate: { lt: new Date() } } } }),
  ]);

  const byClass = new Map<string, number>();
  for (const e of enrollments) byClass.set(e.section.class.name, (byClass.get(e.section.class.name) ?? 0) + 1);
  const enrollmentByClass = [...byClass.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const totalResults = results.length;
  const passCount = results.filter((r) => r.marksObtained >= r.examSubject.passMarks).length;
  const avgPercentage = totalResults ? Math.round(results.reduce((sum, r) => sum + (r.marksObtained / r.examSubject.maxMarks) * 100, 0) / totalResults) : null;
  const passRate = totalResults ? Math.round((passCount / totalResults) * 100) : null;

  return {
    people: { students: enrollments.length, teachers: teacherCount, parents: parentCount, staff: staffCount },
    academics: { activeAcademicYear: activeYear?.label ?? null, enrollmentByClass },
    attendance: { rateLast30Days: attendanceRate(attendanceRecords), totalRecords: attendanceRecords.length },
    exams: { avgPercentage, passRate, totalResults },
    assignments: { total: assignments.length, totalSubmissions: assignments.reduce((sum, a) => sum + a.submissions.length, 0) },
    finance: {
      totalDue: feeAgg._sum.amountDue ?? 0,
      totalCollected: feeAgg._sum.amountPaid ?? 0,
      totalOutstanding: (feeAgg._sum.amountDue ?? 0) - (feeAgg._sum.amountPaid ?? 0),
      overdueCount,
    },
  };
}

/** Teacher's own-class report (§07 "R (own class)") — every section they're class teacher of, plus marks for subjects they actually teach (via TimetableSlot, the same ownership source every other Phase 03/04 check uses). */
export async function getClassReport(teacherId: string) {
  const since = new Date(Date.now() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Round 1: three queries with no dependency on each other, fired together —
  // each sequential `await` pays Neon's per-query round-trip separately, so
  // batching independent reads into one Promise.all matters here.
  const [sections, slots, assignments] = await Promise.all([
    prisma.section.findMany({ where: { classTeacherId: teacherId }, include: { class: true } }),
    prisma.timetableSlot.findMany({ where: { teacherId }, select: { subjectId: true, sectionId: true } }),
    prisma.assignment.findMany({ where: { createdById: teacherId }, include: { submissions: true } }),
  ]);

  // Round 2: each depends on a Round 1 result, but not on each other — one
  // batched attendance query for every section, not one round trip per
  // section, same reasoning.
  const sectionIds = sections.map((s) => s.id);
  const [allAttendance, examSubjects] = await Promise.all([
    sectionIds.length ? prisma.attendanceRecord.findMany({ where: { sectionId: { in: sectionIds }, date: { gte: since } }, select: { sectionId: true, status: true } }) : [],
    slots.length ? prisma.examSubject.findMany({ where: { OR: slots.map((s) => ({ subjectId: s.subjectId, sectionId: s.sectionId })) }, include: { subject: true, results: true } }) : [],
  ]);

  const attendanceBySection: Point[] = sections.map((s) => ({
    label: `${s.class.name} ${s.name}`,
    value: attendanceRate(allAttendance.filter((r) => r.sectionId === s.id)) ?? 0,
  }));

  const bySubject = new Map<string, { sum: number; count: number }>();
  for (const es of examSubjects) {
    for (const r of es.results) {
      const agg = bySubject.get(es.subject.name) ?? { sum: 0, count: 0 };
      agg.sum += (r.marksObtained / es.maxMarks) * 100;
      agg.count += 1;
      bySubject.set(es.subject.name, agg);
    }
  }
  const avgMarksBySubject: Point[] = [...bySubject.entries()].map(([label, { sum, count }]) => ({ label, value: Math.round(sum / count) }));

  return {
    classCount: sections.length,
    attendanceBySection,
    avgMarksBySubject,
    assignments: { total: assignments.length, totalSubmissions: assignments.reduce((sum, a) => sum + a.submissions.length, 0) },
  };
}

/** Financial report — §07 gives ACCOUNTANT "R (financial)" and SCHOOL_ADMIN the same scope they already share on fees/payments (Phase 06). Tenant-scoped automatically for both roles. */
export async function getFinancialReport() {
  const buckets = monthBuckets(TREND_MONTHS);

  const [payments, expenses, feeAgg, overdueCount] = await Promise.all([
    prisma.payment.findMany({ select: { amount: true, paidAt: true } }),
    prisma.expense.findMany({ select: { amount: true, category: true, date: true } }),
    prisma.studentFee.aggregate({ _sum: { amountDue: true, amountPaid: true } }),
    prisma.studentFee.count({ where: { status: { not: "PAID" }, feeItem: { dueDate: { lt: new Date() } } } }),
  ]);

  const collectionByMonth = bucketByMonth(payments, (p) => p.paidAt, buckets, (p) => p.amount);
  const expensesByMonth = bucketByMonth(expenses, (e) => e.date, buckets, (e) => e.amount);

  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  let expensesByCategory = [...byCategory.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (expensesByCategory.length > 6) {
    const other = expensesByCategory.slice(5).reduce((sum, e) => sum + e.value, 0);
    expensesByCategory = [...expensesByCategory.slice(0, 5), { label: "Other", value: other }];
  }

  return {
    collectionByMonth,
    expensesByMonth,
    expensesByCategory,
    totalCollected: feeAgg._sum.amountPaid ?? 0,
    totalOutstanding: (feeAgg._sum.amountDue ?? 0) - (feeAgg._sum.amountPaid ?? 0),
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    overdueCount,
  };
}
