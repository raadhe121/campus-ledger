import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { PersonStatusBadge } from "../../components/PersonStatusBadge";
import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { useGetMyTeacherDashboardQuery } from "../me/meApi";

const GRADIENT = "from-amber-500 to-orange-600";
const GLOW = "rgba(217,119,6,0.35)";

export function TeacherDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, error } = useGetMyTeacherDashboardQuery();

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

  const { teacher, classes } = data.data;
  const totalStudents = classes.reduce((sum, c) => sum + c.roster.length, 0);

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Teacher"
        eyebrowIcon="cast_for_education"
        title={`Welcome back, ${user?.firstName}!`}
        gradient={GRADIENT}
        subtitle={
          <>
            {teacher.profile.designation ?? "Teacher"}
            {teacher.profile.department ? ` · ${teacher.profile.department}` : ""}
          </>
        }
      />

      {classes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">
            You haven't been assigned as a class teacher yet — your School Admin sets this when creating or editing a section.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="layers" label="My classes" value={classes.length} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="groups" label="Total students" value={totalStudents} gradient={GRADIENT} glow={GLOW} />
          </div>

          <div className="space-y-5">
            {classes.map((c) => (
              <section key={c.id} className="bg-surface border border-line rounded-2xl card-shadow overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${GRADIENT} shrink-0`} style={{ boxShadow: `0 8px 20px -6px ${GLOW}` }}>
                      <Icon name="menu_book" size={20} filled />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-ink">
                        {c.class.name} · {c.name}
                      </h2>
                      <p className="text-xs text-muted">
                        {c.academicYear.label}
                        {c.roomNo ? ` · Room ${c.roomNo}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-semibold ring-1 ring-amber-600/15">
                    {c.roster.length} student{c.roster.length === 1 ? "" : "s"}
                  </span>
                </div>

                {c.roster.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[480px]">
                      <thead>
                        <tr className="bg-surface-2 border-b border-line">
                          <th className="text-xs uppercase tracking-wider text-muted font-semibold py-2.5 px-6">Roll no.</th>
                          <th className="text-xs uppercase tracking-wider text-muted font-semibold py-2.5 px-6">Student</th>
                          <th className="text-xs uppercase tracking-wider text-muted font-semibold py-2.5 px-6 hidden sm:table-cell">Email</th>
                          <th className="text-xs uppercase tracking-wider text-muted font-semibold py-2.5 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-line">
                        {c.roster.map((enrollment) => (
                          <tr key={enrollment.id} className="hover:bg-surface-2 transition-colors">
                            <td className="py-2.5 px-6 font-mono text-muted">{enrollment.rollNo ?? "—"}</td>
                            <td className="py-2.5 px-6 font-medium text-ink">
                              {enrollment.student.firstName} {enrollment.student.lastName}
                            </td>
                            <td className="py-2.5 px-6 text-muted text-xs hidden sm:table-cell">{enrollment.student.email}</td>
                            <td className="py-2.5 px-6 text-center">
                              <PersonStatusBadge status={enrollment.student.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted text-center">No students enrolled in this section yet.</p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
