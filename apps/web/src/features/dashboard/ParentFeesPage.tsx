import { Icon } from "../../components/Icon";
import { ChildPicker } from "../../components/ChildPicker";
import { useGetChildFeesQuery } from "../me/meApi";
import { useSelectedChild } from "./useSelectedChild";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-surface-2 text-muted",
  PARTIAL: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
};

export function ParentFeesPage() {
  const { children, studentId, selected, setStudentId, isLoading: childrenLoading } = useSelectedChild();
  const { data, isLoading, error } = useGetChildFeesQuery(studentId, { skip: !studentId });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Parent</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Fees</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              Every charge on {selected.student.firstName} {selected.student.lastName}'s account.
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
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load fees.</p>
      ) : data.data.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No fee charges on this account yet.</p>
      ) : (
        <div className="space-y-4">
          {data.data.map((f) => (
            <div key={f.id} className="bg-surface border border-line rounded-xl p-5 card-shadow flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {f.feeStructure.name} — {f.feeItem.label}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Due {new Date(f.feeItem.dueDate).toLocaleDateString()}
                  {f.isOverdue && <span className="text-rose-600 font-medium"> · overdue</span>}
                </p>
                <p className="text-sm text-ink mt-1">
                  ₹{f.amountPaid.toLocaleString()} <span className="text-muted">of</span> ₹{f.amountDue.toLocaleString()}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[f.status] ?? ""}`}>{f.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
