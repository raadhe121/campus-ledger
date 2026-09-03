import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubjectSchema, type CreateSubjectInput } from "@campus-ledger/validation-schemas";
import { useListSubjectsQuery, useCreateSubjectMutation, useDeleteSubjectMutation } from "./academicsApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function SubjectsPage() {
  const { data, isLoading, error } = useListSubjectsQuery();
  const [remove, { isLoading: deleting }] = useDeleteSubjectMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Academics</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Subjects</h1>
        <p className="text-sm text-muted mt-1">School-wide — not tied to a specific class or year.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load subjects.</p>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                      <th className="px-4 py-3.5">Name</th>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Elective</th>
                      <th className="px-4 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {data.data.map((subject) => (
                      <tr key={subject.id} className="hover:bg-surface-2/40">
                        <td className="px-4 py-3.5 font-semibold text-ink">{subject.name}</td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">{subject.code}</td>
                        <td className="px-4 py-3.5">
                          {subject.isElective ? (
                            <span className="inline-flex rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-[11px] font-bold">ELECTIVE</span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={async () => {
                              setRowError(null);
                              try {
                                await remove(subject.id).unwrap();
                              } catch (err) {
                                setRowError(apiErrorMessage(err));
                              }
                            }}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Delete
                          </button>
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
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📝</div>
              <p className="font-medium text-ink mt-3">No subjects yet</p>
              <p className="text-sm text-muted mt-1">Create the first one.</p>
            </div>
          )}
        </div>

        <CreateSubjectForm />
      </div>
    </div>
  );
}

function CreateSubjectForm() {
  const [createSubject, { isLoading }] = useCreateSubjectMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubjectInput>({ resolver: zodResolver(createSubjectSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createSubject(values).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">New subject</p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="subject-name" className="text-xs font-semibold text-ink">
          Name
        </label>
        <input
          id="subject-name"
          {...register("name")}
          placeholder="Mathematics"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.name && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.name.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="code" className="text-xs font-semibold text-ink">
          Code
        </label>
        <input
          id="code"
          {...register("code")}
          placeholder="MATH"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.code && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.code.message}</p>}
      </div>
      <label className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 px-3 py-2.5 text-sm text-ink cursor-pointer">
        <input type="checkbox" {...register("isElective")} className="rounded border-line text-accent focus:ring-accent" />
        Elective subject
      </label>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Creating…" : "Create subject"}
      </button>
    </form>
  );
}
