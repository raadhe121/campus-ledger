import { Icon } from "../../components/Icon";
import { ChildPicker } from "../../components/ChildPicker";
import { useGetChildAssignmentsQuery } from "../me/meApi";
import { useSelectedChild } from "./useSelectedChild";

export function ParentAssignmentsPage() {
  const { children, studentId, selected, setStudentId, isLoading: childrenLoading } = useSelectedChild();
  const { data, isLoading, error } = useGetChildAssignmentsQuery(studentId, { skip: !studentId });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Parent</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Assignments</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              Work posted for {selected.student.firstName} {selected.student.lastName}'s section.
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
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load assignments.</p>
      ) : data.data.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No assignments posted yet.</p>
      ) : (
        <div className="space-y-4">
          {data.data.map((a) => {
            const graded = Boolean(a.mySubmission?.grade);
            return (
              <div key={a.id} className="bg-surface border border-line rounded-xl p-5 card-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {a.subject.name} · {a.createdBy.firstName} {a.createdBy.lastName} · Due {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {a.mySubmission ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${graded ? "bg-emerald-50 text-emerald-700" : "bg-accent-soft text-accent-strong"}`}
                    >
                      <Icon name={graded ? "check_circle" : "task_alt"} size={14} filled={graded} />
                      {graded ? `Graded: ${a.mySubmission.grade}` : "Submitted"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-surface-2 text-muted px-2.5 py-0.5 text-xs font-medium">Not submitted</span>
                  )}
                </div>
                {a.description && <p className="text-sm text-muted mt-2">{a.description}</p>}
                {a.mySubmission?.feedback && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Feedback</p>
                    <p className="text-sm text-emerald-900 mt-0.5">{a.mySubmission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
