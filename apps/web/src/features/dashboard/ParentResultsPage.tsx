import type { ResultWithDetails } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { ChildPicker } from "../../components/ChildPicker";
import { useGetChildResultsQuery } from "../me/meApi";
import { useSelectedChild } from "./useSelectedChild";

export function ParentResultsPage() {
  const { children, studentId, selected, setStudentId, isLoading: childrenLoading } = useSelectedChild();
  const { data, isLoading, error } = useGetChildResultsQuery(studentId, { skip: !studentId });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Parent</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Results</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              {selected.student.firstName} {selected.student.lastName}'s marks, grouped by exam.
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
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load results.</p>
      ) : data.data.results.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted card-shadow">No results have been entered yet.</p>
      ) : (
        <ResultsBody results={data.data.results} passCount={data.data.passCount} failCount={data.data.failCount} />
      )}
    </div>
  );
}

function ResultsBody({ results, passCount, failCount }: { results: ResultWithDetails[]; passCount: number; failCount: number }) {
  const byExam = new Map<string, { name: string; results: ResultWithDetails[] }>();
  for (const r of results) {
    const exam = r.examSubject.exam;
    const entry = byExam.get(exam.id) ?? { name: exam.name, results: [] };
    entry.results.push(r);
    byExam.set(exam.id, entry);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-line rounded-xl p-5 card-shadow">
          <p className="text-3xl font-bold tracking-tight text-emerald-600 font-mono">{passCount}</p>
          <p className="text-sm font-medium text-muted mt-0.5">Passed</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-5 card-shadow">
          <p className="text-3xl font-bold tracking-tight text-rose-600 font-mono">{failCount}</p>
          <p className="text-sm font-medium text-muted mt-0.5">Failed</p>
        </div>
      </div>

      <div className="space-y-5 mt-5">
        {Array.from(byExam.entries()).map(([examId, group]) => (
          <section key={examId} className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-line bg-surface-2">
              <h2 className="text-sm font-bold text-ink">{group.name}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2.5 px-6 text-xs uppercase tracking-wider text-muted font-semibold">Subject</th>
                    <th className="py-2.5 px-6 text-xs uppercase tracking-wider text-muted font-semibold">Marks</th>
                    <th className="py-2.5 px-6 text-xs uppercase tracking-wider text-muted font-semibold text-center">Grade</th>
                    <th className="py-2.5 px-6 text-xs uppercase tracking-wider text-muted font-semibold text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-line">
                  {group.results.map((r) => {
                    const passed = r.marksObtained >= r.examSubject.passMarks;
                    return (
                      <tr key={r.id}>
                        <td className="py-2.5 px-6 font-medium text-ink">{r.examSubject.subject.name}</td>
                        <td className="py-2.5 px-6 font-mono text-muted">
                          {r.marksObtained} / {r.examSubject.maxMarks}
                        </td>
                        <td className="py-2.5 px-6 text-center font-semibold text-ink">{r.grade ?? "—"}</td>
                        <td className="py-2.5 px-6 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {passed ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
