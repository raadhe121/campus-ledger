import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { TrendBarChart } from "../../components/charts/TrendBarChart";
import { RankedBarList } from "../../components/charts/RankedBarList";
import { useGetSchoolReportQuery, useGetFinancialReportQuery } from "./reportsApi";

const GRADIENT = "from-indigo-500 to-blue-600";
const GLOW = "rgba(99,102,241,0.35)";
const INDIGO = "#6366f1";

export function SchoolAdminReportsPage() {
  const { data: schoolRes, isLoading: schoolLoading, error: schoolError } = useGetSchoolReportQuery();
  const { data: financialRes, isLoading: financialLoading } = useGetFinancialReportQuery();
  const report = schoolRes?.data;
  const financial = financialRes?.data;

  return (
    <div className="space-y-6">
      <PortalHero eyebrow="School Admin" eyebrowIcon="query_stats" title="Reports" gradient={GRADIENT} subtitle="Your school's academics, attendance, exams and finances, all in one place." />

      {schoolError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load the school report.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="school" label="Active students" value={schoolLoading ? undefined : report!.people.students} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="event_available" label="Attendance (30d)" value={schoolLoading ? undefined : (report!.attendance.rateLast30Days ?? "—") + (report!.attendance.rateLast30Days !== null ? "%" : "")} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="military_tech" label="Exam pass rate" value={schoolLoading ? undefined : (report!.exams.passRate ?? "—") + (report!.exams.passRate !== null ? "%" : "")} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="account_balance_wallet" label="Fees collected" value={schoolLoading ? undefined : `₹${report!.finance.totalCollected.toLocaleString()}`} gradient={GRADIENT} glow={GLOW} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Enrollment by class</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Active students, per class.</p>
              {schoolLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <RankedBarList data={report!.academics.enrollmentByClass} color={INDIGO} emptyLabel="No active enrollments yet." />}
            </section>

            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Fees collected</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Per month, last 6 months.</p>
              {financialLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <TrendBarChart data={financial!.collectionByMonth} color={INDIGO} formatValue={(v) => `₹${v.toLocaleString()}`} />}
            </section>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryTile label="Academic year" value={schoolLoading ? "…" : (report!.academics.activeAcademicYear ?? "None active")} />
            <SummaryTile label="Exam average" value={schoolLoading ? "…" : report!.exams.avgPercentage !== null ? `${report!.exams.avgPercentage}%` : "No results yet"} />
            <SummaryTile label="Assignments posted" value={schoolLoading ? "…" : `${report!.assignments.total} · ${report!.assignments.totalSubmissions} submissions`} />
            <SummaryTile label="Fees outstanding" value={schoolLoading ? "…" : `₹${report!.finance.totalOutstanding.toLocaleString()} · ${report!.finance.overdueCount} overdue`} />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4 card-shadow">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-base font-semibold text-ink mt-1.5 truncate">{value}</p>
    </div>
  );
}
