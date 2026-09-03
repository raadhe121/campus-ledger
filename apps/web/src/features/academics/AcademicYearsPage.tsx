import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAcademicYearSchema, type CreateAcademicYearInput } from "@campus-ledger/validation-schemas";
import {
  useListAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useActivateAcademicYearMutation,
  useDeleteAcademicYearMutation,
} from "./academicsApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function AcademicYearsPage() {
  const { data, isLoading, error } = useListAcademicYearsQuery();
  const [activate, { isLoading: activating }] = useActivateAcademicYearMutation();
  const [remove, { isLoading: deleting }] = useDeleteAcademicYearMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Academics</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Academic years</h1>
        <p className="text-sm text-muted mt-1">Only one can be active at a time — classes are created inside a specific year.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">⚠️</div>
              <p className="text-sm font-medium text-rose-700 mt-3">Could not load academic years.</p>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                      <th className="px-4 py-3.5">Label</th>
                      <th className="px-4 py-3.5">Dates</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {data.data.map((year) => (
                      <tr key={year.id} className="hover:bg-surface-2/40 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-ink">{year.label}</td>
                        <td className="px-4 py-3.5 text-muted text-xs font-mono">
                          {new Date(year.startDate).toLocaleDateString()} – {new Date(year.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5">
                          {year.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold tracking-widest">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 px-2.5 py-1 text-[11px] font-bold tracking-widest">INACTIVE</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            {!year.isActive && (
                              <button
                                type="button"
                                disabled={activating}
                                onClick={() => activate(year.id)}
                                className="rounded-full bg-accent text-accent-ink px-3 py-1 text-xs font-semibold hover:bg-accent-strong disabled:opacity-60"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={async () => {
                                setRowError(null);
                                try {
                                  await remove(year.id).unwrap();
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
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📅</div>
              <p className="font-medium text-ink mt-3">No academic years yet</p>
              <p className="text-sm text-muted mt-1">Create the first one to get started.</p>
            </div>
          )}
        </div>

        <CreateAcademicYearForm />
      </div>
    </div>
  );
}

function CreateAcademicYearForm() {
  const [createYear, { isLoading }] = useCreateAcademicYearMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearInput>({ resolver: zodResolver(createAcademicYearSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createYear(values).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">New academic year</p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="label" className="text-xs font-semibold text-ink">
          Label
        </label>
        <input
          id="label"
          {...register("label")}
          placeholder="2026-2027"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        />
        {errors.label && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.label.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="startDate" className="text-xs font-semibold text-ink">
          Start date
        </label>
        <input
          id="startDate"
          type="date"
          {...register("startDate")}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.startDate && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.startDate.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="endDate" className="text-xs font-semibold text-ink">
          End date
        </label>
        <input
          id="endDate"
          type="date"
          {...register("endDate")}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.endDate && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.endDate.message}</p>}
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 transition-colors shadow-sm"
      >
        {isLoading ? "Creating…" : "Create academic year"}
      </button>
    </form>
  );
}
