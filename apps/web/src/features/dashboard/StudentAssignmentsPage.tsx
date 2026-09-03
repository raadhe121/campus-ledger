import { useState } from "react";
import type { AssignmentWithMySubmission } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useGetMyAssignmentsQuery, useSubmitMyAssignmentMutation } from "../me/meApi";

export function StudentAssignmentsPage() {
  const { data, isLoading, error } = useGetMyAssignmentsQuery();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Student</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Assignments</h1>
        <p className="text-sm text-muted mt-1">Work posted for your section — submit or update your answer any time before it's graded.</p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-surface-2 animate-pulse" />
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your assignments.</p>
      ) : data.data.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No assignments posted for your section yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: AssignmentWithMySubmission }) {
  const [submit, { isLoading }] = useSubmitMyAssignmentMutation();
  const [content, setContent] = useState(assignment.mySubmission?.content ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const graded = Boolean(assignment.mySubmission?.grade);

  const onSubmit = async () => {
    setFormError(null);
    setSaved(false);
    if (!content.trim()) {
      setFormError("Write something before submitting.");
      return;
    }
    try {
      await submit({ assignmentId: assignment.id, body: { content: content.trim() } }).unwrap();
      setSaved(true);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  };

  const overdue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="bg-surface border border-line rounded-xl p-5 card-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{assignment.title}</p>
          <p className="text-xs text-muted mt-0.5">
            {assignment.subject.name} · {assignment.createdBy.firstName} {assignment.createdBy.lastName} ·{" "}
            <span className={overdue && !assignment.mySubmission ? "text-rose-600 font-medium" : ""}>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
          </p>
        </div>
        {assignment.mySubmission ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${graded ? "bg-emerald-50 text-emerald-700" : "bg-accent-soft text-accent-strong"}`}>
            <Icon name={graded ? "check_circle" : "task_alt"} size={14} filled={graded} />
            {graded ? `Graded: ${assignment.mySubmission.grade}` : "Submitted"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-surface-2 text-muted px-2.5 py-0.5 text-xs font-medium">Not submitted</span>
        )}
      </div>

      {assignment.description && <p className="text-sm text-muted mt-2">{assignment.description}</p>}

      {assignment.mySubmission?.feedback && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Feedback</p>
          <p className="text-sm text-emerald-900 mt-0.5">{assignment.mySubmission.feedback}</p>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        <label className="text-xs font-semibold text-ink">{assignment.mySubmission ? "Your answer" : "Write your answer"}</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Type your answer, or paste a link to your work…"
          className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="rounded-lg bg-accent text-accent-ink text-sm font-semibold px-4 py-2 hover:bg-accent-strong disabled:opacity-60 transition-colors"
          >
            {isLoading ? "Saving…" : assignment.mySubmission ? "Resubmit" : "Submit"}
          </button>
          {formError && <p className="text-xs text-rose-600">{formError}</p>}
          {saved && !formError && <p className="text-xs text-emerald-700">Saved.</p>}
        </div>
      </div>
    </div>
  );
}
