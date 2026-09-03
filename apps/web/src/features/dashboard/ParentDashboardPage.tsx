import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { ParentStudentLinkWithStudent } from "@campus-ledger/shared-types";
import type { RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { InitialsAvatar } from "../../components/InitialsAvatar";
import { PortalHero } from "../../components/PortalHero";
import { useGetMyChildrenQuery, useGetChildDashboardQuery } from "../me/meApi";

const GRADIENT = "from-rose-500 to-pink-600";

export function ParentDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, error } = useGetMyChildrenQuery();
  const children = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Parent"
        eyebrowIcon="family_restroom"
        title={`Welcome back, ${user?.firstName}!`}
        gradient={GRADIENT}
        subtitle="Everything below is scoped to your own children only."
      />

      {isLoading ? (
        <div className="h-40 rounded-2xl bg-surface-2 animate-pulse" />
      ) : error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your children.</p>
      ) : children.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No children are linked to your account yet — ask your School Admin to link them.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((link) => (
            <ChildCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildCard({ link }: { link: ParentStudentLinkWithStudent }) {
  const { data } = useGetChildDashboardQuery(link.studentId);
  const dashboard = data?.data;
  const enrollment = dashboard?.currentEnrollment;

  return (
    <div className="relative overflow-hidden bg-surface border border-line rounded-2xl p-5 card-shadow card-shadow-hover transition-all">
      <div className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${GRADIENT} opacity-[0.08] blur-2xl`} />
      <div className="relative flex items-start gap-3">
        <InitialsAvatar name={`${link.student.firstName} ${link.student.lastName}`} size={44} rounded="rounded-full" />
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">
            {link.student.firstName} {link.student.lastName}
          </p>
          <p className="text-xs text-muted capitalize">
            {link.relation.toLowerCase()}
            {link.isPrimaryGuardian ? " · primary guardian" : ""}
          </p>
        </div>
      </div>

      {dashboard && (
        <dl className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted uppercase tracking-wider">Admission no.</dt>
            <dd className="text-ink font-mono">{dashboard.student.profile.admissionNo}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase tracking-wider">Class</dt>
            <dd className="text-ink">{enrollment ? `${enrollment.class.name} · ${enrollment.section.name}` : "Not enrolled"}</dd>
          </div>
        </dl>
      )}

      <div className="relative mt-4 pt-4 border-t border-line flex flex-wrap gap-x-4 gap-y-2">
        <Link to="/parent/attendance" className="text-xs font-semibold text-rose-600 hover:underline">
          Attendance
        </Link>
        <Link to="/parent/timetable" className="text-xs font-semibold text-rose-600 hover:underline">
          Timetable
        </Link>
        <Link to="/parent/results" className="text-xs font-semibold text-rose-600 hover:underline">
          Results
        </Link>
        <Link to="/parent/assignments" className="text-xs font-semibold text-rose-600 hover:underline">
          Assignments
        </Link>
        <Link to="/parent/fees" className="text-xs font-semibold text-rose-600 hover:underline">
          Fees
        </Link>
      </div>
    </div>
  );
}
