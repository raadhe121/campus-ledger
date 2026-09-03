import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { SubmissionWithStudent } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useListSubmissionsQuery, useGradeSubmissionMutation } from "./assignmentsApi";

export function SubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { data, isLoading, error } = useListSubmissionsQuery(assignmentId!);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link to="/teacher/assignments" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <Icon name="arrow_back" size={16} />
          Assignments
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mt-4">Teacher</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Submissions</h1>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-surface-2 animate-pulse" />
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load submissions.</p>
      ) : data.data.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {data.data.map((s) => (
            <SubmissionRow key={s.id} submission={s} assignmentId={assignmentId!} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ submission, assignmentId }: { submission: SubmissionWithStudent; assignmentId: string }) {
  const [gradeSubmission, { isLoading }] = useGradeSubmissionMutation();
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setFormError(null);
    setSaved(false);
    if (!grade.trim()) {
      setFormError("A grade is required.");
      return;
    }
    try {
      await gradeSubmission({ submissionId: submission.id, assignmentId, body: { grade: grade.trim(), feedback: feedback.trim() || undefined } }).unwrap();
      setSaved(true);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  };

  return (
    <div className="bg-surface border border-line rounded-xl p-5 card-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {submission.student.firstName} {submission.student.lastName}
          </p>
          <p className="text-xs text-muted">
            {submission.student.email} · Submitted {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        {submission.grade && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">Graded: {submission.grade}</span>
        )}
      </div>

      <p className="text-sm text-ink whitespace-pre-wrap bg-paper border border-line rounded-lg p-3 mt-3">{submission.content}</p>

      <div className="grid sm:grid-cols-[120px_1fr_auto] gap-3 items-start mt-4">
        <div className="grid gap-1">
          <label className="text-xs font-semibold text-ink">Grade</label>
          <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-semibold text-ink">Feedback</label>
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback…" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading}
          className="self-end rounded-lg bg-accent text-accent-ink text-sm font-semibold px-4 py-2 hover:bg-accent-strong disabled:opacity-60 transition-colors"
        >
          {isLoading ? "Saving…" : "Save"}
        </button>
      </div>
      {formError && <p className="text-xs text-rose-600 mt-2">{formError}</p>}
      {saved && <p className="text-xs text-emerald-700 mt-2">Saved.</p>}
    </div>
  );
}
