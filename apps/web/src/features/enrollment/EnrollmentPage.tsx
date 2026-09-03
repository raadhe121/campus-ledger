import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEnrollmentSchema, type CreateEnrollmentInput } from "@campus-ledger/validation-schemas";
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery } from "../academics/academicsApi";
import { useListStudentsQuery } from "../people/peopleApi";
import {
  useListEnrollmentsQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useTransferEnrollmentMutation,
  usePromoteEnrollmentsMutation,
} from "./enrollmentApi";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

const STATUS_STYLES: Record<string, { cls: string; dot: string }> = {
  ACTIVE: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  TRANSFERRED: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  WITHDRAWN: { cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  COMPLETED: { cls: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
};

export function EnrollmentPage() {
  const { data: yearsRes } = useListAcademicYearsQuery();
  const years = yearsRes?.data ?? [];
  const [yearOverride, setYearOverride] = useState("");
  const yearId = yearOverride || years.find((y) => y.isActive)?.id || years[0]?.id || "";

  const { data, isLoading, error } = useListEnrollmentsQuery(yearId ? { academicYearId: yearId } : undefined, { skip: !yearId });
  const [updateEnrollment] = useUpdateEnrollmentMutation();
  const [transferEnrollment] = useTransferEnrollmentMutation();
  const sectionsForYear = useSectionsForYear(yearId);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showPromote, setShowPromote] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-6 card-shadow relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Enrollment · StudentClass history</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Enrollment</h1>
            <p className="text-sm text-muted mt-1">Each year is a new row — 2025-2026 Class 5 A → 2026-2027 Class 6 B preserves both (COMPLETED + ACTIVE).</p>
          </div>
          <div className="flex gap-2">
            {years.length > 0 && (
              <select
                value={yearId}
                onChange={(e) => setYearOverride(e.target.value)}
                className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label} {y.isActive ? "· active" : ""}
                  </option>
                ))}
              </select>
            )}
            <button onClick={() => setShowPromote((v) => !v)} className="rounded-full bg-ink text-white px-4 py-2.5 text-sm font-semibold hover:bg-black">
              {showPromote ? "Hide promote" : "Promote →"}
            </button>
          </div>
        </div>
      </div>

      {showPromote && years.length >= 2 && <PromotePanel years={years} />}

      {years.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center card-shadow">Create and activate an academic year first.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
              </div>
            ) : error ? (
              <p className="p-8 text-center text-sm text-rose-700">Could not load enrollments.</p>
            ) : data && data.data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                        <th className="px-4 py-3.5">Student</th>
                        <th className="px-4 py-3.5">Class · Section</th>
                        <th className="px-4 py-3.5">Roll</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Transfer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {data.data.map((enrollment) => {
                        const st = STATUS_STYLES[enrollment.status] ?? STATUS_STYLES.ACTIVE;
                        return (
                          <tr key={enrollment.id} className="hover:bg-surface-2/40">
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-ink leading-none">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </p>
                              <p className="text-xs font-mono text-muted">{enrollment.student.email}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-medium text-ink text-xs">
                                {enrollment.class.name} · {enrollment.section.name}
                              </p>
                              <p className="text-xs text-muted">{enrollment.academicYear.label}</p>
                            </td>
                            <td className="px-4 py-3.5 text-muted font-mono text-xs">{enrollment.rollNo ?? "—"}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-widest ${st.cls}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                {enrollment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex justify-end gap-2">
                                {sectionsForYear.length > 1 && enrollment.status === "ACTIVE" && (
                                  <select
                                    defaultValue=""
                                    onChange={async (e) => {
                                      if (!e.target.value) return;
                                      setRowError(null);
                                      try {
                                        await transferEnrollment({ enrollmentId: enrollment.id, body: { targetSectionId: e.target.value } }).unwrap();
                                      } catch (err) {
                                        setRowError(apiErrorMessage(err));
                                        try {
                                          await updateEnrollment({ enrollmentId: enrollment.id, body: { sectionId: e.target.value } }).unwrap();
                                          setRowError(null);
                                        } catch (e2) {
                                          setRowError(apiErrorMessage(e2));
                                        }
                                      }
                                      e.target.value = "";
                                    }}
                                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium"
                                  >
                                    <option value="">Transfer…</option>
                                    {sectionsForYear
                                      .filter((s) => s.id !== enrollment.sectionId)
                                      .map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.className} · {s.name}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                {enrollment.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setRowError(null);
                                      try {
                                        await updateEnrollment({ enrollmentId: enrollment.id, body: { status: "WITHDRAWN" } }).unwrap();
                                      } catch (err) {
                                        setRowError(apiErrorMessage(err));
                                      }
                                    }}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                  >
                                    Withdraw
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rowError && <p className="px-4 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}
              </>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📋</div>
                <p className="font-medium text-ink mt-3">No enrollments in this year yet</p>
                <p className="text-sm text-muted mt-1">Enroll students or promote from previous year.</p>
              </div>
            )}
          </div>

          <CreateEnrollmentForm academicYearId={yearId} />
        </div>
      )}
    </div>
  );
}

function PromotePanel({ years }: { years: { id: string; label: string; isActive: boolean }[] }) {
  const [sourceId, setSourceId] = useState(years[0]?.id ?? "");
  const [targetId, setTargetId] = useState(years[1]?.id ?? years[0]?.id ?? "");
  const { data: sourceData } = useListEnrollmentsQuery(sourceId ? { academicYearId: sourceId } : undefined, { skip: !sourceId });
  const { data: targetClassesRes } = useListClassesQuery(targetId ? { academicYearId: targetId } : undefined, { skip: !targetId });
  const targetClasses = targetClassesRes?.data ?? [];
  const [targetClassId, setTargetClassId] = useState("");
  const effectiveTargetClassId = targetClasses.some((c) => c.id === targetClassId) ? targetClassId : (targetClasses[0]?.id ?? "");
  const { data: targetSectionsRes } = useListSectionsQuery(effectiveTargetClassId ? { classId: effectiveTargetClassId } : undefined, { skip: !effectiveTargetClassId });
  const targetSections = targetSectionsRes?.data ?? [];

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [promote, { isLoading }] = usePromoteEnrollmentsMutation();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const sourceEnrollments = sourceData?.data ?? [];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center text-sm">⤴</div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Bulk promote</p>
          <p className="text-sm font-semibold text-ink">Move students to next year — history kept, source becomes COMPLETED.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Source year</span>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Target year</span>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Target class</span>
          <select value={effectiveTargetClassId} onChange={(e) => setTargetClassId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            {targetClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-xl bg-surface-2/40 border border-line p-3 text-xs text-muted">
          {targetSections.length ? `${targetSections.length} sections available` : "Create target class/section first"}
        </div>
      </div>

      {sourceEnrollments.length === 0 ? (
        <p className="text-sm text-muted">No students in source year to promote.</p>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-[11px] uppercase tracking-widest font-bold text-muted sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Current</th>
                <th className="px-3 py-2 text-left">Target section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {sourceEnrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-medium text-ink">
                    {e.student.firstName} {e.student.lastName}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {e.class.name} · {e.section.name}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={selected[e.studentId] ?? ""}
                      onChange={(v) => setSelected((s) => ({ ...s, [e.studentId]: v.target.value }))}
                      className="rounded-full border border-line bg-surface px-2 py-1 text-xs"
                    >
                      <option value="">— skip —</option>
                      {targetSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {err && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{err}</p>}
      {done && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">{done}</p>}

      <button
        disabled={isLoading || Object.values(selected).filter(Boolean).length === 0}
        onClick={async () => {
          setErr(null);
          setDone(null);
          const promotions = Object.entries(selected)
            .filter(([, v]) => v)
            .map(([studentId, targetSectionId]) => ({ studentId, targetSectionId }));
          if (!promotions.length) {
            setErr("Select at least one target section");
            return;
          }
          try {
            await promote({ sourceAcademicYearId: sourceId, targetAcademicYearId: targetId, promotions }).unwrap();
            setDone(`Promoted ${promotions.length} student(s) — source now COMPLETED, history preserved.`);
            setSelected({});
          } catch (e) {
            setErr(apiErrorMessage(e));
          }
        }}
        className="rounded-full bg-accent text-accent-ink py-2.5 text-sm font-semibold hover:bg-accent-strong disabled:opacity-60"
      >
        {isLoading ? "Promoting…" : `Promote ${Object.values(selected).filter(Boolean).length} → ${years.find((y) => y.id === targetId)?.label ?? ""}`}
      </button>
    </div>
  );
}

function useSectionsForYear(academicYearId: string) {
  const { data: classesRes } = useListClassesQuery(academicYearId ? { academicYearId } : undefined, { skip: !academicYearId });
  const { data: sectionsRes } = useListSectionsQuery({ limit: 100 });
  const classes = classesRes?.data ?? [];
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  return (sectionsRes?.data ?? [])
    .filter((s) => classNameById.has(s.classId))
    .map((s) => ({ id: s.id, name: s.name, classId: s.classId, className: classNameById.get(s.classId)! }));
}

function CreateEnrollmentForm({ academicYearId }: { academicYearId: string }) {
  const { data: classesRes } = useListClassesQuery(academicYearId ? { academicYearId } : undefined, { skip: !academicYearId });
  const classes = classesRes?.data ?? [];
  const [classOverride, setClassOverride] = useState("");
  const classId = classes.some((c) => c.id === classOverride) ? classOverride : (classes[0]?.id ?? "");

  const { data: sectionsRes } = useListSectionsQuery(classId ? { classId } : undefined, { skip: !classId });
  const sections = sectionsRes?.data ?? [];
  const { data: studentsRes } = useListStudentsQuery();
  const students = studentsRes?.data ?? [];

  const [createEnrollment, { isLoading }] = useCreateEnrollmentMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<CreateEnrollmentInput, "academicYearId">>({ resolver: zodResolver(createEnrollmentSchema.omit({ academicYearId: true })) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createEnrollment({ ...values, academicYearId }).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (classes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-sm text-muted card-shadow">Create a class and section in this year first.</div>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Enroll a student</p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="e-student" className="text-xs font-semibold text-ink">
          Student
        </label>
        <select id="e-student" {...register("studentId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— select —</option>
          {students.map((s) => (
            <option key={s.user.id} value={s.user.id}>
              {s.user.firstName} {s.user.lastName} ({s.profile.admissionNo})
            </option>
          ))}
        </select>
        {errors.studentId && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.studentId.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="e-class" className="text-xs font-semibold text-ink">
          Class
        </label>
        <select
          id="e-class"
          value={classId}
          onChange={(e) => setClassOverride(e.target.value)}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="e-section" className="text-xs font-semibold text-ink">
          Section
        </label>
        <select id="e-section" key={classId} {...register("sectionId")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="">— select —</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.sectionId && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.sectionId.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="e-rollNo" className="text-xs font-semibold text-ink">
          Roll no. <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="e-rollNo" {...register("rollNo")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink font-semibold text-sm py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Enrolling…" : "Enroll student"}
      </button>
    </form>
  );
}
