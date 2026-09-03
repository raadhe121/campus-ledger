import { useState } from "react";
import type { MarksRosterEntry } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useGetMarksRosterQuery, useEnterMarksMutation } from "./examSubjectsApi";

interface Draft {
  marksObtained: string;
  remarks: string;
}

/**
 * The roster + bulk-save marks entry screen — shared by School Admin's
 * "Manage" scope and Teacher's "CRU (own subject)" scope (§07). Ownership
 * is enforced server-side; this component just renders whatever roster
 * the API hands back, same shape as attendance's per-section marking UI.
 */
export function MarksEntryForm({ examSubjectId, maxMarks, passMarks }: { examSubjectId: string; maxMarks: number; passMarks: number }) {
  const { data, isLoading, error } = useGetMarksRosterQuery(examSubjectId);
  const [enterMarks, { isLoading: saving }] = useEnterMarksMutation();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const roster = data?.data ?? [];

  const draftFor = (entry: MarksRosterEntry): Draft =>
    drafts[entry.studentId] ?? { marksObtained: entry.result ? String(entry.result.marksObtained) : "", remarks: entry.result?.remarks ?? "" };

  const setMarks = (entry: MarksRosterEntry, marksObtained: string) => {
    setSavedCount(null);
    setDrafts((d) => ({ ...d, [entry.studentId]: { ...draftFor(entry), marksObtained } }));
  };
  const setRemarks = (entry: MarksRosterEntry, remarks: string) => {
    setSavedCount(null);
    setDrafts((d) => ({ ...d, [entry.studentId]: { ...draftFor(entry), remarks } }));
  };

  const onSave = async () => {
    setSaveError(null);
    setSavedCount(null);
    const records = roster
      .map((entry) => ({ studentId: entry.studentId, draft: draftFor(entry) }))
      .filter((r) => r.draft.marksObtained.trim() !== "")
      .map((r) => ({ studentId: r.studentId, marksObtained: Number(r.draft.marksObtained), remarks: r.draft.remarks.trim() || undefined }));

    if (records.length === 0) {
      setSaveError("Enter at least one mark before saving.");
      return;
    }
    if (records.some((r) => Number.isNaN(r.marksObtained) || r.marksObtained < 0 || r.marksObtained > maxMarks)) {
      setSaveError(`Marks must be between 0 and ${maxMarks}.`);
      return;
    }

    try {
      const res = await enterMarks({ examSubjectId, body: { records } }).unwrap();
      setSavedCount(res.data.length);
    } catch (err) {
      setSaveError(apiErrorMessage(err));
    }
  };

  if (isLoading) return <div className="h-64 rounded-xl bg-surface-2 animate-pulse" />;
  if (error || !data) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load the roster.</p>;
  if (roster.length === 0) return <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No students enrolled in this section yet.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-xl p-4 card-shadow">
        <p className="text-sm text-muted">
          Max marks <span className="font-semibold text-ink">{maxMarks}</span> · Pass marks <span className="font-semibold text-ink">{passMarks}</span> · Total
          students {roster.length}
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-accent text-accent-ink px-6 py-2 text-sm font-semibold hover:bg-accent-strong disabled:opacity-60 shadow-sm transition-colors active:scale-95"
        >
          {saving ? "Saving…" : "Save marks"}
        </button>
      </div>

      {saveError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{saveError}</p>}
      {savedCount !== null && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
          <Icon name="check_circle" filled size={16} />
          Saved marks for {savedCount} student{savedCount === 1 ? "" : "s"}.
        </p>
      )}

      <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold">Student</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold w-32">Marks</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold text-center w-28">Result</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {roster.map((entry) => {
                const draft = draftFor(entry);
                const numeric = Number(draft.marksObtained);
                const hasValue = draft.marksObtained.trim() !== "" && !Number.isNaN(numeric);
                const passed = hasValue && numeric >= passMarks;
                return (
                  <tr key={entry.studentId} className="hover:bg-surface-2/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <p className="text-sm font-medium text-ink">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {entry.rollNo ? `Roll ${entry.rollNo} · ` : ""}
                        {entry.admissionNo}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={draft.marksObtained}
                        onChange={(e) => setMarks(entry, e.target.value)}
                        placeholder="—"
                        className="w-24 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {hasValue && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {passed ? "Pass" : "Fail"}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={draft.remarks}
                        onChange={(e) => setRemarks(entry, e.target.value)}
                        placeholder="Add remark…"
                        className="w-full border-0 border-b border-transparent focus:border-accent bg-transparent focus:ring-0 p-1 text-sm text-ink placeholder:text-muted/60 transition-colors"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
