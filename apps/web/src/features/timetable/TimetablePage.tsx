import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTimetableSlotSchema, type CreateTimetableSlotInput } from "@campus-ledger/validation-schemas";
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery, useListSubjectsQuery } from "../academics/academicsApi";
import { useListTeachersQuery } from "../people/peopleApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useListTimetableSlotsQuery, useCreateTimetableSlotMutation, useDeleteTimetableSlotMutation } from "./timetableApi";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function TimetablePage() {
  const { data: yearsRes } = useListAcademicYearsQuery();
  const years = yearsRes?.data ?? [];
  const [yearOverride, setYearOverride] = useState("");
  const yearId = yearOverride || years.find((y) => y.isActive)?.id || years[0]?.id || "";

  const { data: classesRes } = useListClassesQuery(yearId ? { academicYearId: yearId } : undefined, { skip: !yearId });
  const classes = classesRes?.data ?? [];
  const [classOverride, setClassOverride] = useState("");
  const classId = classes.some((c) => c.id === classOverride) ? classOverride : (classes[0]?.id ?? "");

  const { data: sectionsRes } = useListSectionsQuery(classId ? { classId } : undefined, { skip: !classId });
  const sections = sectionsRes?.data ?? [];
  const [sectionOverride, setSectionOverride] = useState("");
  const sectionId = sections.some((s) => s.id === sectionOverride) ? sectionOverride : (sections[0]?.id ?? "");

  const { data, isLoading, error } = useListTimetableSlotsQuery(sectionId ? { sectionId, limit: 100 } : undefined, { skip: !sectionId });
  const [remove, { isLoading: deleting }] = useDeleteTimetableSlotMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  const slots = (data?.data ?? []).slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Academics</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Timetable</h1>
          <p className="text-sm text-muted mt-1">Weekly schedule, one section at a time — a Teacher and Student both read their own slice of this.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {years.length > 0 && (
            <select
              value={yearId}
              onChange={(e) => {
                setYearOverride(e.target.value);
                setClassOverride("");
                setSectionOverride("");
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
            <select
              value={classId}
              onChange={(e) => {
                setClassOverride(e.target.value);
                setSectionOverride("");
              }}
              className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {sections.length > 0 && (
            <select value={sectionId} onChange={(e) => setSectionOverride(e.target.value)} className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
      ) : sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center card-shadow">Create a section in this class first.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
              </div>
            ) : error ? (
              <p className="p-8 text-center text-sm text-rose-700">Could not load the timetable.</p>
            ) : slots.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                        <th className="px-4 py-3.5">Day</th>
                        <th className="px-4 py-3.5">Time</th>
                        <th className="px-4 py-3.5">Subject</th>
                        <th className="px-4 py-3.5">Teacher</th>
                        <th className="px-4 py-3.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-surface-2/40">
                          <td className="px-4 py-3.5 font-semibold text-ink">{DAY_LABELS[slot.dayOfWeek]}</td>
                          <td className="px-4 py-3.5 text-muted font-mono text-xs">
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </td>
                          <td className="px-4 py-3.5 text-ink">{slot.subject.name}</td>
                          <td className="px-4 py-3.5 text-muted">
                            {slot.teacher.firstName} {slot.teacher.lastName}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={async () => {
                                setRowError(null);
                                try {
                                  await remove(slot.id).unwrap();
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
                <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📅</div>
                <p className="font-medium text-ink mt-3">No slots for this section yet</p>
              </div>
            )}
          </div>

          <CreateSlotForm key={sectionId} sectionId={sectionId} />
        </div>
      )}
    </div>
  );
}

function CreateSlotForm({ sectionId }: { sectionId: string }) {
  const { data: subjectsRes } = useListSubjectsQuery();
  const subjects = subjectsRes?.data ?? [];
  const { data: teachersRes } = useListTeachersQuery();
  const teachers = teachersRes?.data ?? [];
  const [createSlot, { isLoading }] = useCreateTimetableSlotMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTimetableSlotInput>({
    resolver: zodResolver(createTimetableSlotSchema),
    defaultValues: { sectionId, dayOfWeek: 1 },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createSlot(values).unwrap();
      reset({ sectionId, dayOfWeek: values.dayOfWeek });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <input type="hidden" {...register("sectionId")} />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">New slot</p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="slot-subjectId" className="text-xs font-semibold text-ink">
          Subject
        </label>
        <select id="slot-subjectId" {...register("subjectId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
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
        <label htmlFor="slot-teacherId" className="text-xs font-semibold text-ink">
          Teacher
        </label>
        <select id="slot-teacherId" {...register("teacherId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— select —</option>
          {teachers.map((t) => (
            <option key={t.user.id} value={t.user.id}>
              {t.user.firstName} {t.user.lastName}
            </option>
          ))}
        </select>
        {errors.teacherId && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{errors.teacherId.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="slot-dayOfWeek" className="text-xs font-semibold text-ink">
          Day
        </label>
        <select id="slot-dayOfWeek" {...register("dayOfWeek", { valueAsNumber: true })} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          {DAY_LABELS.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="slot-startTime" className="text-xs font-semibold text-ink">
            Start
          </label>
          <input id="slot-startTime" type="time" {...register("startTime")} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="slot-endTime" className="text-xs font-semibold text-ink">
            End
          </label>
          <input id="slot-endTime" type="time" {...register("endTime")} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
        </div>
      </div>
      {(errors.startTime || errors.endTime) && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 -mt-2">
          {errors.startTime?.message ?? errors.endTime?.message}
        </p>
      )}

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading || !sectionId}
        className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Creating…" : "Create slot"}
      </button>
    </form>
  );
}
