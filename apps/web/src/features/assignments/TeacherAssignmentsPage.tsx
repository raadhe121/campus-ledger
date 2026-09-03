import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { createAssignmentSchema, type CreateAssignmentInput } from "@campus-ledger/validation-schemas";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useGetMyTimetableQuery } from "../me/meApi";
import { useListAssignmentsQuery, useCreateAssignmentMutation, useDeleteAssignmentMutation } from "./assignmentsApi";

export function TeacherAssignmentsPage() {
  const { data, isLoading, error } = useListAssignmentsQuery({ limit: 100 });
  const [remove, { isLoading: deleting }] = useDeleteAssignmentMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Teacher</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Assignments</h1>
        <p className="text-sm text-muted mt-1">Work you've posted — only for subjects you actually teach.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="h-40 bg-surface-2 animate-pulse" />
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load your assignments.</p>
          ) : data && data.data.length > 0 ? (
            <ul className="divide-y divide-line">
              {data.data.map((a) => (
                <li key={a.id} className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {a.subject.name} · {a.section.className} {a.section.name} · Due {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                    {a.description && <p className="text-sm text-muted mt-1.5">{a.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link to={`/teacher/assignments/${a.id}/submissions`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                      <Icon name="grading" size={16} />
                      Submissions
                    </Link>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={async () => {
                        setRowError(null);
                        try {
                          await remove(a.id).unwrap();
                        } catch (err) {
                          setRowError(apiErrorMessage(err));
                        }
                      }}
                      className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-10 text-center text-sm text-muted">No assignments posted yet.</p>
          )}
          {rowError && <p className="px-5 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}
        </div>

        <CreateAssignmentForm />
      </div>
    </div>
  );
}

function CreateAssignmentForm() {
  const { data: timetableRes } = useGetMyTimetableQuery();
  const teaching = Array.from(
    new Map((timetableRes?.data ?? []).map((s) => [`${s.subjectId}:${s.sectionId}`, { subjectId: s.subjectId, sectionId: s.sectionId, label: `${s.subject.name} · ${s.section.className} ${s.section.name}` }])).values(),
  );

  const [createAssignment, { isLoading }] = useCreateAssignmentMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateAssignmentInput>({ resolver: zodResolver(createAssignmentSchema) });

  const onPairChange = (value: string) => {
    const [subjectId, sectionId] = value.split(":");
    setValue("subjectId", subjectId ?? "");
    setValue("sectionId", sectionId ?? "");
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createAssignment(values).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (teaching.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
        <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Icon name="hourglass_empty" size={20} />
        </span>
        <p className="text-sm text-amber-900">You aren't on the timetable for any subject yet — assignments can only be posted for what you teach.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="bg-surface border border-line rounded-xl p-5 card-shadow grid gap-4 sticky top-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">New assignment</p>

      <div className="grid gap-1.5">
        <label htmlFor="ca-pair" className="text-xs font-semibold text-ink">
          Subject &amp; section
        </label>
        <select id="ca-pair" onChange={(e) => onPairChange(e.target.value)} defaultValue="" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm">
          <option value="" disabled>
            — select —
          </option>
          {teaching.map((t) => (
            <option key={`${t.subjectId}:${t.sectionId}`} value={`${t.subjectId}:${t.sectionId}`}>
              {t.label}
            </option>
          ))}
        </select>
        <input type="hidden" {...register("subjectId")} />
        <input type="hidden" {...register("sectionId")} />
        {(errors.subjectId || errors.sectionId) && <p className="text-xs text-rose-600">Pick a subject &amp; section.</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="ca-title" className="text-xs font-semibold text-ink">
          Title
        </label>
        <input id="ca-title" {...register("title")} placeholder="Essay on motion" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="ca-description" className="text-xs font-semibold text-ink">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea id="ca-description" {...register("description")} rows={3} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="ca-dueDate" className="text-xs font-semibold text-ink">
          Due date
        </label>
        <input id="ca-dueDate" type="date" {...register("dueDate")} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.dueDate && <p className="text-xs text-rose-600">{errors.dueDate.message}</p>}
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{formError}</p>}

      <button type="submit" disabled={isLoading} className="rounded-lg bg-accent text-accent-ink font-semibold text-sm py-2.5 hover:bg-accent-strong disabled:opacity-60 shadow-sm transition-colors">
        {isLoading ? "Posting…" : "Post assignment"}
      </button>
    </form>
  );
}
