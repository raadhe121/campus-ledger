import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentSchema, type CreateStudentInput } from "@campus-ledger/validation-schemas";
import {
  useListStudentsQuery,
  useCreateStudentMutation,
  useSetStudentStatusMutation,
  useGetStudentHistoryQuery,
  useEnrollStudentMutation,
  useTransferStudentMutation,
} from "./peopleApi";
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery } from "../academics/academicsApi";
import { PersonStatusBadge } from "../../components/PersonStatusBadge";
import { TempPasswordCallout } from "../../components/TempPasswordCallout";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function StudentsPage() {
  const { data, isLoading, error } = useListStudentsQuery();
  const [setStatus, { isLoading: statusChanging }] = useSetStudentStatusMutation();
  const [rowError, setRowError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [enrollId, setEnrollId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter(
      ({ user, profile }) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        profile.admissionNo.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-6 card-shadow relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 blur-2xl" />
        <p className="relative text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">People · Full enrollment</p>
        <h1 className="relative text-2xl font-semibold tracking-tight text-ink mt-1">Students</h1>
        <p className="relative text-sm text-muted mt-1">Admits with full profile — address, guardian, emergency, photo — and class history preserved per year (Enrollment = StudentClass).</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, admission no…"
            className="w-full rounded-full border border-line bg-surface pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <span className="text-xs font-mono text-muted">{filtered.length} students</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load students.</p>
          ) : filtered.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                      <th className="px-4 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Admission</th>
                      <th className="px-4 py-3.5 hidden lg:table-cell">Contact</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filtered.map(({ user, profile }) => (
                      <tr key={user.id} className="hover:bg-surface-2/40">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {profile.profilePhotoUrl ? (
                              <img src={profile.profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-line" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-xs font-bold">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-ink leading-none">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted font-mono">{profile.guardianName ? `Guardian: ${profile.guardianName}` : user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs font-medium text-ink">{profile.admissionNo}</p>
                          <p className="text-xs text-muted">{profile.address ? profile.address.slice(0, 24) + (profile.address.length > 24 ? "…" : "") : "—"}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <p className="font-mono text-xs text-muted">{user.phone ?? "—"}</p>
                          <p className="text-xs text-muted">{profile.emergencyContactName ? `SOS: ${profile.emergencyContactName}` : ""}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <PersonStatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end flex-wrap gap-1.5">
                            <button onClick={() => setHistoryId(user.id)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold hover:bg-surface-2">
                              History
                            </button>
                            <button onClick={() => setEnrollId(user.id)} className="rounded-full bg-accent text-accent-ink px-3 py-1 text-xs font-semibold hover:bg-accent-strong">
                              Enroll
                            </button>
                            <button
                              disabled={statusChanging}
                              onClick={async () => {
                                setRowError(null);
                                try {
                                  await setStatus({ userId: user.id, body: { status: user.status === "DISABLED" ? "ACTIVE" : "DISABLED" } }).unwrap();
                                } catch (err) {
                                  setRowError(apiErrorMessage(err));
                                }
                              }}
                              className={`rounded-full px-3 py-1 text-xs font-semibold border disabled:opacity-60 ${user.status === "DISABLED" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-ink border-line"}`}
                            >
                              {user.status === "DISABLED" ? "Reactivate" : "Disable"}
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
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">🎓</div>
              <p className="font-medium text-ink mt-3">No students yet</p>
              <p className="text-sm text-muted mt-1">Admit the first one — full profile + photo + history.</p>
            </div>
          )}
        </div>

        <CreateStudentForm />
      </div>

      {historyId && <StudentHistoryModal studentId={historyId} onClose={() => setHistoryId(null)} />}
      {enrollId && <EnrollModal studentId={enrollId} onClose={() => setEnrollId(null)} />}
    </div>
  );
}

function StudentHistoryModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { data, isLoading } = useGetStudentHistoryQuery(studentId);
  const history = data?.data.history ?? [];
  const student = data?.data.student;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-surface border border-line card-shadow max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-line flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-gold">Student history · StudentClass</p>
            <h3 className="font-semibold text-ink">
              {student ? `${student.user.firstName} ${student.user.lastName}` : "Loading…"} <span className="font-mono text-xs text-muted">· {history.length} years</span>
            </h3>
            {student && <p className="text-xs font-mono text-muted">{student.profile.admissionNo} · {student.profile.address ?? ""}</p>}
          </div>
          <button onClick={onClose} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold hover:bg-surface-2">
            Close
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted">Loading history…</p>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center">
              <p className="text-sm text-muted">No enrollments yet — history preserved per Enrollment row.</p>
              <p className="text-xs text-muted mt-1">Enroll: 2025-2026 → Class 5 A, then promote to 2026-2027 → Class 6 B — both rows stay.</p>
            </div>
          ) : (
            <div className="relative border-l border-line ml-3 space-y-4">
              {history.map((h) => (
                <div key={h.id} className="relative pl-6">
                  <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-surface ${h.status === "ACTIVE" ? "bg-emerald-500" : h.status === "COMPLETED" ? "bg-sky-500" : "bg-amber-500"}`} />
                  <div className="rounded-xl border border-line bg-surface-2/30 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink text-sm">{h.academicYear.label}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-widest ${h.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : h.status === "COMPLETED" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {h.status}
                      </span>
                      {h.rollNo && <span className="font-mono text-xs text-muted">Roll {h.rollNo}</span>}
                    </div>
                    <p className="text-sm text-ink mt-1">
                      {h.class.name} · Section {h.section.name} <span className="text-muted">· {h.section.className}</span>
                    </p>
                    <p className="text-xs font-mono text-muted mt-1">{h.academicYear.label} · {new Date(h.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EnrollModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { data: yearsRes } = useListAcademicYearsQuery();
  const years = yearsRes?.data ?? [];
  const [yearId, setYearId] = useState<string>(years.find((y) => y.isActive)?.id ?? years[0]?.id ?? "");
  const { data: classesRes } = useListClassesQuery(yearId ? { academicYearId: yearId } : undefined, { skip: !yearId });
  const classes = classesRes?.data ?? [];
  const [classId, setClassId] = useState("");
  const effectiveClassId = classes.some((c) => c.id === classId) ? classId : (classes[0]?.id ?? "");
  const { data: sectionsRes } = useListSectionsQuery(effectiveClassId ? { classId: effectiveClassId } : undefined, { skip: !effectiveClassId });
  const sections = sectionsRes?.data ?? [];
  const [sectionId, setSectionId] = useState("");
  const effectiveSectionId = sections.some((s) => s.id === sectionId) ? sectionId : (sections[0]?.id ?? "");
  const [rollNo, setRollNo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [enroll, { isLoading }] = useEnrollStudentMutation();
  const [transfer, { isLoading: transferring }] = useTransferStudentMutation();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-surface border border-line card-shadow p-5 grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">Enroll / Assign / Transfer</h3>
          <button onClick={onClose} className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-surface-2">
            Close
          </button>
        </div>
        <p className="text-xs text-muted">Academic Year → Class → Section. History preserved: 2025-2026 Class5 A → 2026-2027 Class6 B keeps both rows (COMPLETED + ACTIVE).</p>

        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-ink">Academic Year</span>
            <select value={yearId} onChange={(e) => setYearId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label} {y.isActive ? "· active" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-ink">Class</span>
            <select value={effectiveClassId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-ink">Section</span>
            <select value={effectiveSectionId} onChange={(e) => setSectionId(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-ink">Roll no. (optional)</span>
            <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm" />
          </label>
        </div>

        {err && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{err}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={isLoading || !effectiveSectionId}
            onClick={async () => {
              setErr(null);
              try {
                await enroll({ userId: studentId, body: { academicYearId: yearId, sectionId: effectiveSectionId, rollNo: rollNo || undefined } }).unwrap();
                onClose();
              } catch (e) {
                setErr(apiErrorMessage(e));
              }
            }}
            className="rounded-full bg-accent text-accent-ink py-2.5 text-sm font-semibold hover:bg-accent-strong disabled:opacity-60"
          >
            {isLoading ? "Enrolling…" : "Enroll"}
          </button>
          <button
            disabled={transferring || !effectiveSectionId}
            onClick={async () => {
              setErr(null);
              try {
                await transfer({ userId: studentId, body: { targetSectionId: effectiveSectionId } }).unwrap();
                onClose();
              } catch (e) {
                setErr(apiErrorMessage(e));
              }
            }}
            className="rounded-full border border-line bg-surface py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-60"
          >
            {transferring ? "Transferring…" : "Transfer"}
          </button>
        </div>
        <p className="text-xs text-muted text-center">Enroll = new year → new row. Transfer = same year → update section. Promote = bulk via Enrollment page.</p>
      </div>
    </div>
  );
}

function CreateStudentForm() {
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudentInput>({ resolver: zodResolver(createStudentSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await createStudent(values).unwrap();
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (created) {
    return <TempPasswordCallout email={created.email} tempPassword={created.tempPassword} onDismiss={() => setCreated(null)} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Admit a student</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="st-firstName" className="text-xs font-semibold text-ink">
            First name
          </label>
          <input id="st-firstName" {...register("firstName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          {errors.firstName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.firstName.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="st-lastName" className="text-xs font-semibold text-ink">
            Last name
          </label>
          <input id="st-lastName" {...register("lastName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          {errors.lastName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="st-email" className="text-xs font-semibold text-ink">
          Email
        </label>
        <input id="st-email" type="email" {...register("email")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
        {errors.email && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.email.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="st-phone" className="text-xs font-semibold text-ink">
          Phone <span className="text-muted font-normal">(opt)</span>
        </label>
        <input id="st-phone" {...register("phone")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>

      <div className="rounded-xl bg-surface-2/30 border border-line p-3 grid gap-3">
        <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-muted">Admission</p>
        <div className="grid gap-1.5">
          <label htmlFor="st-admissionNo" className="text-xs font-semibold text-ink">
            Admission no.
          </label>
          <input id="st-admissionNo" {...register("admissionNo")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          {errors.admissionNo && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.admissionNo.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="st-dob" className="text-xs font-semibold text-ink">
              DOB <span className="text-muted font-normal">(opt)</span>
            </label>
            <input id="st-dob" type="date" {...register("dob")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="st-gender" className="text-xs font-semibold text-ink">
              Gender <span className="text-muted font-normal">(opt)</span>
            </label>
            <select id="st-gender" {...register("gender")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
              <option value="">— select —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="st-bloodGroup" className="text-xs font-semibold text-ink">
              Blood group <span className="text-muted font-normal">(opt)</span>
            </label>
            <input id="st-bloodGroup" {...register("bloodGroup")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" placeholder="O+" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="st-admissionDate" className="text-xs font-semibold text-ink">
              Admission date <span className="text-muted font-normal">(opt)</span>
            </label>
            <input id="st-admissionDate" type="date" {...register("admissionDate")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-surface-2/30 border border-line p-3 grid gap-3">
        <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-muted">Contact & address</p>
        <div className="grid gap-1.5">
          <label htmlFor="st-address" className="text-xs font-semibold text-ink">
            Address <span className="text-muted font-normal">(opt)</span>
          </label>
          <textarea id="st-address" {...register("address")} rows={2} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" placeholder="123 MG Road, Bangalore" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="st-photo" className="text-xs font-semibold text-ink">
            Profile photo URL <span className="text-muted font-normal">(opt)</span>
          </label>
          <input id="st-photo" {...register("profilePhotoUrl")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" placeholder="https://…" />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-3 grid gap-3">
        <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-amber-800">Parent / Guardian</p>
        <div className="grid gap-1.5">
          <label htmlFor="st-guardianName" className="text-xs font-semibold text-ink">
            Guardian name <span className="text-muted font-normal">(opt)</span>
          </label>
          <input id="st-guardianName" {...register("guardianName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="st-guardianPhone" className="text-xs font-semibold text-ink">
              Guardian phone
            </label>
            <input id="st-guardianPhone" {...register("guardianPhone")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="st-guardianRelation" className="text-xs font-semibold text-ink">
              Relation
            </label>
            <input id="st-guardianRelation" {...register("guardianRelation")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" placeholder="FATHER" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-rose-50/50 border border-rose-200 p-3 grid gap-3">
        <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-rose-800">Emergency contact</p>
        <div className="grid gap-1.5">
          <label htmlFor="st-emergencyName" className="text-xs font-semibold text-ink">
            Contact name <span className="text-muted font-normal">(opt)</span>
          </label>
          <input id="st-emergencyName" {...register("emergencyContactName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="st-emergencyPhone" className="text-xs font-semibold text-ink">
              Phone
            </label>
            <input id="st-emergencyPhone" {...register("emergencyContactPhone")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="st-emergencyRelation" className="text-xs font-semibold text-ink">
              Relation
            </label>
            <input id="st-emergencyRelation" {...register("emergencyContactRelation")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
          </div>
        </div>
      </div>

      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink text-sm font-semibold py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Admitting…" : "Admit student"}
      </button>
    </form>
  );
}
