import { useState } from "react";
import type { AttendanceRosterEntry, AttendanceStatus } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useGetMyTeacherDashboardQuery } from "../me/meApi";
import { useGetAttendanceRosterQuery, useMarkAttendanceMutation } from "./attendanceApi";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: string; activeCls: string; ringCls: string }[] = [
  { value: "PRESENT", label: "Present", icon: "check_circle", activeCls: "bg-emerald-600 border-emerald-600 text-white", ringCls: "focus-visible:ring-emerald-500" },
  { value: "ABSENT", label: "Absent", icon: "cancel", activeCls: "bg-rose-600 border-rose-600 text-white", ringCls: "focus-visible:ring-rose-500" },
  { value: "LATE", label: "Late", icon: "schedule", activeCls: "bg-amber-500 border-amber-500 text-white", ringCls: "focus-visible:ring-amber-500" },
  { value: "EXCUSED", label: "Excused", icon: "info", activeCls: "bg-slate-500 border-slate-500 text-white", ringCls: "focus-visible:ring-slate-400" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function MarkAttendancePage() {
  const { data: teacherRes, isLoading: teacherLoading } = useGetMyTeacherDashboardQuery();
  const classes = teacherRes?.data.classes ?? [];
  const [sectionOverride, setSectionOverride] = useState("");
  const sectionId = classes.some((c) => c.id === sectionOverride) ? sectionOverride : (classes[0]?.id ?? "");
  const selected = classes.find((c) => c.id === sectionId);
  const [date, setDate] = useState(todayIso);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Teacher</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Mark Attendance</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              {selected.class.name} · {selected.name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-surface border border-line rounded-lg p-2 card-shadow">
          {classes.length > 1 && (
            <select
              value={sectionId}
              onChange={(e) => setSectionOverride(e.target.value)}
              className="rounded-md border-none bg-transparent px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class.name} · {c.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2 px-2">
            <Icon name="calendar_month" size={18} className="text-muted" />
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="border-none bg-transparent text-sm focus:outline-none focus:ring-0 p-0"
            />
          </div>
        </div>
      </div>

      {teacherLoading ? (
        <div className="h-40 rounded-xl bg-surface-2 animate-pulse" />
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">You aren't the class teacher of any section yet — attendance can only be marked for your own class.</p>
        </div>
      ) : (
        <AttendanceForm key={`${sectionId}:${date}`} sectionId={sectionId} date={date} />
      )}
    </div>
  );
}

interface Draft {
  status: AttendanceStatus | null;
  notes: string;
}

function AttendanceForm({ sectionId, date }: { sectionId: string; date: string }) {
  const { data, isLoading, error } = useGetAttendanceRosterQuery({ sectionId, date });
  const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const roster = data?.data ?? [];

  const draftFor = (entry: AttendanceRosterEntry): Draft => drafts[entry.studentId] ?? { status: entry.record?.status ?? null, notes: entry.record?.notes ?? "" };

  const setStatus = (entry: AttendanceRosterEntry, status: AttendanceStatus) => {
    setSavedCount(null);
    setDrafts((d) => ({ ...d, [entry.studentId]: { ...draftFor(entry), status } }));
  };
  const setNotes = (entry: AttendanceRosterEntry, notes: string) => {
    setSavedCount(null);
    setDrafts((d) => ({ ...d, [entry.studentId]: { ...draftFor(entry), notes } }));
  };

  const selectAllPresent = () => {
    setSavedCount(null);
    const next: Record<string, Draft> = {};
    for (const entry of roster) next[entry.studentId] = { status: "PRESENT", notes: draftFor(entry).notes };
    setDrafts(next);
  };

  const resetAll = () => {
    setSavedCount(null);
    setDrafts({});
  };

  const onSave = async () => {
    setSaveError(null);
    setSavedCount(null);
    const records = roster
      .map((entry) => ({ studentId: entry.studentId, draft: draftFor(entry) }))
      .filter((r) => r.draft.status !== null)
      .map((r) => ({ studentId: r.studentId, status: r.draft.status as AttendanceStatus, notes: r.draft.notes.trim() || undefined }));

    if (records.length === 0) {
      setSaveError("Mark at least one student before saving.");
      return;
    }

    try {
      const res = await markAttendance({ sectionId, date: new Date(date), records }).unwrap();
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
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" onChange={(e) => e.target.checked && selectAllPresent()} className="h-5 w-5 rounded border-line text-accent focus:ring-accent cursor-pointer" />
          <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors">Select all present</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted mr-2">Total students: {roster.length}</span>
          <button type="button" onClick={resetAll} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors">
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-accent text-accent-ink px-6 py-2 text-sm font-semibold hover:bg-accent-strong disabled:opacity-60 shadow-sm transition-colors active:scale-95"
          >
            {saving ? "Saving…" : "Save attendance"}
          </button>
        </div>
      </div>

      {saveError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{saveError}</p>}
      {savedCount !== null && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
          <Icon name="check_circle" filled size={16} />
          Saved attendance for {savedCount} student{savedCount === 1 ? "" : "s"}.
        </p>
      )}

      <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold w-14">No.</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold">Student</th>
                {STATUS_OPTIONS.map((opt) => (
                  <th key={opt.value} className="py-3 px-3 text-xs uppercase tracking-wider text-muted font-semibold text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Icon name={opt.icon} size={18} />
                      {opt.label}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-muted font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {roster.map((entry, i) => {
                const draft = draftFor(entry);
                return (
                  <tr key={entry.studentId} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="py-2.5 px-4 text-sm text-muted">{String(i + 1).padStart(2, "0")}</td>
                    <td className="py-2.5 px-4">
                      <p className="text-sm font-medium text-ink">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {entry.rollNo ? `Roll ${entry.rollNo} · ` : ""}
                        {entry.admissionNo}
                      </p>
                    </td>
                    {STATUS_OPTIONS.map((opt) => (
                      <td key={opt.value} className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          aria-label={`Mark ${entry.firstName} ${entry.lastName} ${opt.label}`}
                          onClick={() => setStatus(entry, opt.value)}
                          className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors outline-none focus-visible:ring-2 ${opt.ringCls} ${
                            draft.status === opt.value ? opt.activeCls : "border-line bg-surface text-muted hover:bg-surface-2"
                          }`}
                        >
                          <Icon name={opt.icon} size={16} filled={draft.status === opt.value} />
                        </button>
                      </td>
                    ))}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={draft.notes}
                        onChange={(e) => setNotes(entry, e.target.value)}
                        placeholder="Add note…"
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
