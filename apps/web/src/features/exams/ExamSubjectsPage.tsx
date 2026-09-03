import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { createExamSubjectSchema, type CreateExamSubjectInput } from "@campus-ledger/validation-schemas";
import { useListClassesQuery, useListSectionsQuery, useListSubjectsQuery } from "../academics/academicsApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useGetExamQuery } from "./examsApi";
import { useListExamSubjectsQuery, useCreateExamSubjectMutation, useDeleteExamSubjectMutation } from "./examSubjectsApi";

export function ExamSubjectsPage() {
  const { examId } = useParams<{ examId: string }>();
  const { data: examRes, isLoading: examLoading } = useGetExamQuery(examId!);
  const { data, isLoading, error } = useListExamSubjectsQuery({ examId, limit: 100 });
  const [remove, { isLoading: deleting }] = useDeleteExamSubjectMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  if (examLoading) return <div className="h-40 rounded-2xl bg-surface-2 animate-pulse" />;
  if (!examRes) return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Exam not found.</p>;

  const exam = examRes.data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/school-admin/exams" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2">
          ← Exams
        </Link>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold mt-4">{exam.type.replace("_", " ")}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">{exam.name}</h1>
        <p className="text-sm text-muted mt-1">
          {new Date(exam.startDate).toLocaleDateString()} – {new Date(exam.endDate).toLocaleDateString()} · add each subject/section pairing that sits this exam.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load exam subjects.</p>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                      <th className="px-4 py-3.5">Subject</th>
                      <th className="px-4 py-3.5">Section</th>
                      <th className="px-4 py-3.5">Marks</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {data.data.map((es) => (
                      <tr key={es.id} className="hover:bg-surface-2/40">
                        <td className="px-4 py-3.5 font-semibold text-ink">{es.subject.name}</td>
                        <td className="px-4 py-3.5 text-muted">
                          {es.section.className} · {es.section.name}
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">
                          {es.passMarks}/{es.maxMarks}
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">{new Date(es.examDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-3">
                            <Link to={`/school-admin/exam-subjects/${es.id}/marks`} className="text-xs font-semibold text-accent-strong hover:underline">
                              Marks
                            </Link>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={async () => {
                                setRowError(null);
                                try {
                                  await remove(es.id).unwrap();
                                } catch (err) {
                                  setRowError(apiErrorMessage(err));
                                }
                              }}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rowError && <p className="px-4 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}
            </>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📚</div>
              <p className="font-medium text-ink mt-3">No subjects scheduled for this exam yet</p>
            </div>
          )}
        </div>

        <CreateExamSubjectForm examId={exam.id} academicYearId={exam.academicYearId} />
      </div>
    </div>
  );
}

function CreateExamSubjectForm({ examId, academicYearId }: { examId: string; academicYearId: string }) {
  const { data: classesRes } = useListClassesQuery({ academicYearId });
  const classes = classesRes?.data ?? [];
  const [classId, setClassId] = useState("");
  const activeClassId = classes.some((c) => c.id === classId) ? classId : (classes[0]?.id ?? "");

  const { data: sectionsRes } = useListSectionsQuery(activeClassId ? { classId: activeClassId } : undefined, { skip: !activeClassId });
  const sections = sectionsRes?.data ?? [];

  const { data: subjectsRes } = useListSubjectsQuery();
  const subjects = subjectsRes?.data ?? [];

  const [createExamSubject, { isLoading }] = useCreateExamSubjectMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExamSubjectInput>({ resolver: zodResolver(createExamSubjectSchema), defaultValues: { examId, maxMarks: 100, passMarks: 40 } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createExamSubject(values).unwrap();
      reset({ examId, maxMarks: 100, passMarks: 40 });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (classes.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted card-shadow">Create a class in this academic year first.</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <input type="hidden" {...register("examId")} />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Add subject</p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="es-subjectId" className="text-xs font-semibold text-ink">
          Subject
        </label>
        <select id="es-subjectId" {...register("subjectId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— select —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.subjectId && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.subjectId.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="es-class" className="text-xs font-semibold text-ink">
          Class
        </label>
        <select id="es-class" value={activeClassId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="es-sectionId" className="text-xs font-semibold text-ink">
          Section
        </label>
        <select id="es-sectionId" {...register("sectionId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— select —</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.sectionId && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.sectionId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="es-maxMarks" className="text-xs font-semibold text-ink">
            Max marks
          </label>
          <input id="es-maxMarks" type="number" {...register("maxMarks", { valueAsNumber: true })} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="es-passMarks" className="text-xs font-semibold text-ink">
            Pass marks
          </label>
          <input id="es-passMarks" type="number" {...register("passMarks", { valueAsNumber: true })} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="es-examDate" className="text-xs font-semibold text-ink">
          Exam date
        </label>
        <input id="es-examDate" type="date" {...register("examDate")} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
        {errors.examDate && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.examDate.message}</p>}
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button type="submit" disabled={isLoading} className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm">
        {isLoading ? "Adding…" : "Add subject"}
      </button>
    </form>
  );
}
