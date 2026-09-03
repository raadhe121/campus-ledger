import { Icon } from "../../components/Icon";
import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { RankedBarList } from "../../components/charts/RankedBarList";
import { useGetClassReportQuery } from "./reportsApi";

const GRADIENT = "from-amber-500 to-orange-600";
const GLOW = "rgba(217,119,6,0.35)";
const AMBER = "#f59e0b";

export function TeacherReportsPage() {
  const { data, isLoading, error } = useGetClassReportQuery();
  const report = data?.data;

  return (
    <div className="space-y-6">
      <PortalHero eyebrow="Teacher" eyebrowIcon="query_stats" title="Reports" gradient={GRADIENT} subtitle="Attendance and marks for the sections you're class teacher of, and the subjects you teach." />

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your report.</p>
      ) : isLoading ? (
        <div className="h-64 rounded-2xl bg-surface-2 animate-pulse" />
      ) : report!.classCount === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">You aren't a class teacher for any section yet — reports need at least one to show anything.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon="layers" label="Classes" value={report!.classCount} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="assignment" label="Assignments posted" value={report!.assignments.total} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="task_alt" label="Submissions received" value={report!.assignments.totalSubmissions} gradient={GRADIENT} glow={GLOW} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Attendance by section</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Present + late rate, last 30 days.</p>
              <RankedBarList data={report!.attendanceBySection} color={AMBER} formatValue={(v) => `${v}%`} emptyLabel="No attendance marked in the last 30 days." />
            </section>

            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Average marks by subject</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Across every exam entered so far, for subjects you teach.</p>
              <RankedBarList data={report!.avgMarksBySubject} color={AMBER} formatValue={(v) => `${v}%`} emptyLabel="No marks entered yet." />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
