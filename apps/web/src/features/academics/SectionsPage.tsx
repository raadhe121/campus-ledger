import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSectionSchema, type CreateSectionInput } from "@campus-ledger/validation-schemas";
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery, useCreateSectionMutation, useDeleteSectionMutation } from "./academicsApi";
import { useListTeachersQuery } from "../people/peopleApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function SectionsPage() {
  const { data: yearsRes } = useListAcademicYearsQuery();
  const years = yearsRes?.data ?? [];
  const [yearOverride, setYearOverride] = useState("");
  const yearId = yearOverride || years.find((y) => y.isActive)?.id || years[0]?.id || "";

  const { data: classesRes } = useListClassesQuery(yearId ? { academicYearId: yearId } : undefined, { skip: !yearId });
  const classes = classesRes?.data ?? [];
  const [classOverride, setClassOverride] = useState("");
  const classId = classes.some((c) => c.id === classOverride) ? classOverride : (classes[0]?.id ?? "");

  const { data, isLoading, error } = useListSectionsQuery(classId ? { classId } : undefined, { skip: !classId });
  const [remove, { isLoading: deleting }] = useDeleteSectionMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Academics</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Sections</h1>
          <p className="text-sm text-muted mt-1">Where students are actually enrolled — one class teacher per section.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {years.length > 0 && (
            <select
              value={yearId}
              onChange={(e) => {
                setYearOverride(e.target.value);
                setClassOverride("");
              }}
              className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          )}
          {classes.length > 0 && (
            <select value={classId} onChange={(e) => setClassOverride(e.target.value)} className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {years.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center card-shadow">Create an academic year first.</div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center card-shadow">Create a class in this academic year first.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
              </div>
            ) : error ? (
              <p className="p-8 text-center text-sm text-rose-700">Could not load sections.</p>
            ) : data && data.data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                        <th className="px-4 py-3.5">Name</th>
                        <th className="px-4 py-3.5">Room</th>
                        <th className="px-4 py-3.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {data.data.map((section) => (
                        <tr key={section.id} className="hover:bg-surface-2/40">
                          <td className="px-4 py-3.5 font-semibold text-ink">{section.name}</td>
                          <td className="px-4 py-3.5 text-muted text-xs font-mono">{section.roomNo ?? "—"}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={async () => {
                                setRowError(null);
                                try {
                                  await remove(section.id).unwrap();
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
                <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">🧩</div>
                <p className="font-medium text-ink mt-3">No sections in this class yet</p>
              </div>
            )}
          </div>

          <CreateSectionForm classId={classId} />
        </div>
      )}
    </div>
  );
}

function CreateSectionForm({ classId }: { classId: string }) {
  const { data: teachersRes } = useListTeachersQuery();
  const teachers = teachersRes?.data ?? [];
  const [createSection, { isLoading }] = useCreateSectionMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<CreateSectionInput, "classId">>({ resolver: zodResolver(createSectionSchema.omit({ classId: true })) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const body = { ...values, classId, classTeacherId: values.classTeacherId || undefined };
      await createSection(body).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">New section</p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="section-name" className="text-xs font-semibold text-ink">
          Name
        </label>
        <input
          id="section-name"
          {...register("name")}
          placeholder="A"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.name && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.name.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="roomNo" className="text-xs font-semibold text-ink">
          Room <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="roomNo" {...register("roomNo")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="classTeacherId" className="text-xs font-semibold text-ink">
          Class teacher <span className="text-muted font-normal">(optional)</span>
        </label>
        <select id="classTeacherId" {...register("classTeacherId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— none —</option>
          {teachers.map((t) => (
            <option key={t.user.id} value={t.user.id}>
              {t.user.firstName} {t.user.lastName}
            </option>
          ))}
        </select>
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Creating…" : "Create section"}
      </button>
    </form>
  );
}
