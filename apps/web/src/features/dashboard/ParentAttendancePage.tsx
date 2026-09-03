import { Icon } from "../../components/Icon";
import { ChildPicker } from "../../components/ChildPicker";
import { useGetChildAttendanceQuery } from "../me/meApi";
import { useSelectedChild } from "./useSelectedChild";

const STATUS_STYLES: Record<string, { cls: string; icon: string }> = {
  PRESENT: { cls: "bg-emerald-50 text-emerald-700", icon: "check_circle" },
  ABSENT: { cls: "bg-rose-50 text-rose-700", icon: "cancel" },
  LATE: { cls: "bg-amber-50 text-amber-700", icon: "schedule" },
  EXCUSED: { cls: "bg-slate-100 text-slate-700", icon: "info" },
};

export function ParentAttendancePage() {
  const { children, studentId, selected, setStudentId, isLoading: childrenLoading } = useSelectedChild();
  const { data, isLoading, error } = useGetChildAttendanceQuery(studentId, { skip: !studentId });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Parent</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Attendance</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              {selected.student.firstName} {selected.student.lastName}
            </p>
          )}
        </div>
        <ChildPicker options={children} studentId={studentId} onChange={setStudentId} />
      </div>

      {childrenLoading || isLoading ? (
        <div className="h-64 rounded-xl bg-surface-2 animate-pulse" />
      ) : children.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No children are linked to your account yet.</p>
        </div>
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load attendance.</p>
      ) : (
        <>
          {data.data.summary.total === 0 ? (
            <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No attendance has been marked yet.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-surface border border-line rounded-xl p-5 card-shadow lg:col-span-1">
                <p className="text-3xl font-bold tracking-tight text-accent font-mono">{data.data.summary.percentPresent}%</p>
                <p className="text-sm font-medium text-muted mt-0.5">Overall</p>
              </div>
              {(
                [
                  ["present", "Present"],
                  ["late", "Late"],
                  ["absent", "Absent"],
                  ["excused", "Excused"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="bg-surface border border-line rounded-xl p-5 card-shadow">
                  <p className="text-3xl font-bold tracking-tight text-ink font-mono">{data.data.summary[key]}</p>
                  <p className="text-sm font-medium text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">History</h2>
            </div>
            {data.data.records.length > 0 ? (
              <ul className="divide-y divide-line">
                {data.data.records.map((r) => {
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
        </>
      )}
    </div>
  );
}
