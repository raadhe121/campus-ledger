import { useState } from "react";
import { Icon } from "../../components/Icon";
import { useGetMyExamSubjectsQuery } from "../me/meApi";
import { MarksEntryForm } from "./MarksEntryForm";

export function EnterMarksPage() {
  const { data, isLoading, error } = useGetMyExamSubjectsQuery();
  const examSubjects = data?.data ?? [];
  const [override, setOverride] = useState("");
  const activeId = examSubjects.some((es) => es.id === override) ? override : (examSubjects[0]?.id ?? "");
  const active = examSubjects.find((es) => es.id === activeId);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Teacher</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Enter Marks</h1>
          {active && (
            <p className="text-sm text-muted mt-1">
              {active.exam.name} · {active.subject.name} · {active.section.className} {active.section.name}
            </p>
          )}
        </div>
        {examSubjects.length > 1 && (
          <select
            value={activeId}
            onChange={(e) => setOverride(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium card-shadow"
          >
            {examSubjects.map((es) => (
              <option key={es.id} value={es.id}>
                {es.exam.name} · {es.subject.name} · {es.section.className} {es.section.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-surface-2 animate-pulse" />
      ) : error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your exam subjects.</p>
      ) : examSubjects.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No exam subjects scheduled for a subject you teach yet.</p>
        </div>
      ) : (
        active && <MarksEntryForm key={active.id} examSubjectId={active.id} maxMarks={active.maxMarks} passMarks={active.passMarks} />
      )}
    </div>
  );
}
