import { Icon } from "../../components/Icon";
import { useGetMyAttendanceQuery } from "../me/meApi";

const STATUS_STYLES: Record<string, { cls: string; icon: string }> = {
  PRESENT: { cls: "bg-emerald-50 text-emerald-700", icon: "check_circle" },
  ABSENT: { cls: "bg-rose-50 text-rose-700", icon: "cancel" },
  LATE: { cls: "bg-amber-50 text-amber-700", icon: "schedule" },
  EXCUSED: { cls: "bg-slate-100 text-slate-700", icon: "info" },
};

export function StudentAttendancePage() {
  const { data, isLoading, error } = useGetMyAttendanceQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded-lg bg-surface-2 animate-pulse" />
        <div className="h-32 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your attendance.</p>;
  }

  const { records, summary } = data.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Student</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">My Attendance</h1>
        <p className="text-sm text-muted mt-1">Every day you've been marked, across every section you've belonged to.</p>
      </div>

      {summary.total === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No attendance has been marked for you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface border border-line rounded-xl p-5 card-shadow lg:col-span-1">
            <p className="text-3xl font-bold tracking-tight text-accent font-mono">{summary.percentPresent}%</p>
            <p className="text-sm font-medium text-muted mt-0.5">Overall</p>
          </div>
          {(
            [
              ["present", "Present", "emerald"],
              ["late", "Late", "amber"],
              ["absent", "Absent", "rose"],
              ["excused", "Excused", "slate"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="bg-surface border border-line rounded-xl p-5 card-shadow">
              <p className="text-3xl font-bold tracking-tight text-ink font-mono">{summary[key]}</p>
              <p className="text-sm font-medium text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">History</h2>
        </div>
        {records.length > 0 ? (
          <ul className="divide-y divide-line">
            {records.map((r) => {
              const s = STATUS_STYLES[r.status];
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {new Date(r.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-muted">
                      {r.section.className} · {r.section.name}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
                    <Icon name={s.icon} size={14} filled />
                    {r.status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-muted">No records yet.</p>
        )}
      </div>
    </div>
  );
}
