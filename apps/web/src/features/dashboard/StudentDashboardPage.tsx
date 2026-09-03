import { Fragment } from "react";
import { useSelector } from "react-redux";
import type { StudentProfile } from "@campus-ledger/shared-types";
import type { RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { useGetMyStudentDashboardQuery } from "../me/meApi";

const GRADIENT = "from-sky-500 to-cyan-600";
const GLOW = "rgba(14,165,233,0.35)";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15",
  TRANSFERRED: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15",
  WITHDRAWN: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
  COMPLETED: "bg-surface-3 text-muted",
};

const PROFILE_FIELDS: { label: string; key: keyof Pick<StudentProfile, "dob" | "gender" | "bloodGroup" | "guardianName" | "guardianPhone"> }[] = [
  { label: "Date of birth", key: "dob" },
  { label: "Gender", key: "gender" },
  { label: "Blood group", key: "bloodGroup" },
  { label: "Guardian", key: "guardianName" },
  { label: "Guardian phone", key: "guardianPhone" },
];

export function StudentDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, error } = useGetMyStudentDashboardQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded-lg bg-surface-2 animate-pulse" />
        <div className="h-32 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-medium text-rose-700">Could not load your dashboard.</p>
      </div>
    );
  }

  const { student, currentEnrollment, history } = data.data;
  const profile = student.profile;

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Student"
        eyebrowIcon="school"
        title={`Welcome back, ${user?.firstName}!`}
        gradient={GRADIENT}
        subtitle={
          <>
            Admission no. <span className="font-mono text-ink">{student.profile.admissionNo}</span>
          </>
        }
      />

      {!currentEnrollment ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">You haven't been enrolled into a class yet — check back once your school admin sets this up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="menu_book" label="Class" value={currentEnrollment.class.name} gradient={GRADIENT} glow={GLOW} />
          <StatCard icon="layers" label="Section" value={currentEnrollment.section.name} gradient={GRADIENT} glow={GLOW} />
          <StatCard icon="tag" label="Roll no." value={currentEnrollment.rollNo ?? "—"} gradient={GRADIENT} glow={GLOW} />
          <StatCard icon="calendar_month" label="Academic year" value={currentEnrollment.academicYear.label} gradient={GRADIENT} glow={GLOW} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-4">Your profile</h2>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted self-center">Email</dt>
            <dd className="text-ink break-all">{student.user.email}</dd>
            {PROFILE_FIELDS.map(
              (f) =>
                profile[f.key] && (
                  <Fragment key={f.key}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted self-center">{f.label}</dt>
                    <dd className="text-ink">{f.key === "dob" ? new Date(profile[f.key]!).toLocaleDateString() : profile[f.key]}</dd>
                  </Fragment>
                ),
            )}
          </dl>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-4">Enrollment history</h2>
          {history.length > 0 ? (
            <ul className="grid gap-2">
              {history
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-ink">
                        {e.class.name} · {e.section.name}
                      </p>
                      <p className="text-xs text-muted">{e.academicYear.label}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status] ?? ""}`}>{e.status}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No enrollment history yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
