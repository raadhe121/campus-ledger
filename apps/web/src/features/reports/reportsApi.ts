import type { ApiSuccess, SchoolStatus } from "@campus-ledger/shared-types";
import { apiSlice } from "../../app/apiSlice";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface PlatformReport {
  totalSchools: number;
  schoolsByStatus: Record<SchoolStatus, number>;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalStaff: number;
  schoolsByMonth: TrendPoint[];
  topSchoolsByEnrollment: TrendPoint[];
}

export interface SchoolStatsReport {
  school: { id: string; name: string; status: SchoolStatus; plan: string; createdAt: string };
  people: { students: number; teachers: number; parents: number; staff: number };
  academics: { classes: number; sections: number; activeAcademicYear: string | null };
  attendanceRateLast30Days: number | null;
  finance: { totalDue: number; totalCollected: number; totalExpenses: number };
}

export interface SchoolReport {
  people: { students: number; teachers: number; parents: number; staff: number };
  academics: { activeAcademicYear: string | null; enrollmentByClass: TrendPoint[] };
  attendance: { rateLast30Days: number | null; totalRecords: number };
  exams: { avgPercentage: number | null; passRate: number | null; totalResults: number };
  assignments: { total: number; totalSubmissions: number };
  finance: { totalDue: number; totalCollected: number; totalOutstanding: number; overdueCount: number };
}

export interface ClassReport {
  classCount: number;
  attendanceBySection: TrendPoint[];
  avgMarksBySubject: TrendPoint[];
  assignments: { total: number; totalSubmissions: number };
}

export interface FinancialReport {
  collectionByMonth: TrendPoint[];
  expensesByMonth: TrendPoint[];
  expensesByCategory: TrendPoint[];
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  overdueCount: number;
}

// Phase 08 (§11) — read-only aggregate reports, one endpoint per §07 Reports
// scope: SUPER_ADMIN "R (all schools)", SCHOOL_ADMIN "R (own school)" (+
// the same financial scope Phase 06 already shares with Accountant),
// TEACHER "R (own class)", ACCOUNTANT "R (financial)". No cache tags —
// nothing here is mutated through this slice, and RTK Query already
// refetches on every mount, which is enough freshness for a report page
// a user revisits rather than watches live.
export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformReport: builder.query<ApiSuccess<PlatformReport>, void>({
      query: () => "/reports/platform",
    }),
    getSchoolStatsReport: builder.query<ApiSuccess<SchoolStatsReport>, string>({
      query: (schoolId) => `/reports/schools/${schoolId}`,
    }),
    getSchoolReport: builder.query<ApiSuccess<SchoolReport>, void>({
      query: () => "/reports/school",
    }),
    getClassReport: builder.query<ApiSuccess<ClassReport>, void>({
      query: () => "/reports/class",
    }),
    getFinancialReport: builder.query<ApiSuccess<FinancialReport>, void>({
      query: () => "/reports/financial",
    }),
  }),
});

export const { useGetPlatformReportQuery, useGetSchoolStatsReportQuery, useGetSchoolReportQuery, useGetClassReportQuery, useGetFinancialReportQuery } = reportsApi;
