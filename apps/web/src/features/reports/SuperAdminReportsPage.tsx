import { Icon } from "../../components/Icon";
import { StatCard } from "../../components/StatCard";
import { TrendBarChart } from "../../components/charts/TrendBarChart";
import { RankedBarList } from "../../components/charts/RankedBarList";
import { useGetPlatformReportQuery } from "./reportsApi";

const VIOLET = "#8b5cf6";
const GRADIENT = "from-indigo-400 via-violet-500 to-fuchsia-500";
const GLOW = "rgba(139,92,246,0.45)";

export function SuperAdminReportsPage() {
  const { data, isLoading, error } = useGetPlatformReportQuery();
  const report = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
          <Icon name="monitoring" size={16} filled />
          Platform Console
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Reports</h1>
        <p className="text-sm text-muted mt-1">Aggregate statistics across every school — never a roster, just the numbers.</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load the platform report.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="school" label="Students" value={isLoading ? undefined : report!.totalStudents} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="cast_for_education" label="Teachers" value={isLoading ? undefined : report!.totalTeachers} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="family_restroom" label="Parents" value={isLoading ? undefined : report!.totalParents} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="badge" label="Staff & accountants" value={isLoading ? undefined : report!.totalStaff} gradient={GRADIENT} glow={GLOW} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">New schools</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Onboarded per month, last 6 months.</p>
              {isLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <TrendBarChart data={report!.schoolsByMonth} color={VIOLET} />}
            </section>

            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Top schools by enrollment</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Student count, largest first.</p>
              {isLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <RankedBarList data={report!.topSchoolsByEnrollment} color={VIOLET} emptyLabel="No students enrolled anywhere yet." />}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
