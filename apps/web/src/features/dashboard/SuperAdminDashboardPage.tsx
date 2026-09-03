import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { InitialsAvatar } from "../../components/InitialsAvatar";
import { useListSchoolsQuery } from "../schools/schoolsApi";
import { StatusBadge } from "../schools/StatusBadge";

const STAT_CARDS: { label: string; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"; icon: string; gradient: string; glow: string }[] = [
  { label: "Total schools", icon: "apartment", gradient: "from-indigo-500 to-violet-600", glow: "rgba(99,102,241,0.35)" },
  { label: "Active", status: "ACTIVE", icon: "check_circle", gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)" },
  { label: "Inactive", status: "INACTIVE", icon: "pause_circle", gradient: "from-slate-400 to-slate-500", glow: "rgba(100,116,139,0.3)" },
  { label: "Suspended", status: "SUSPENDED", icon: "block", gradient: "from-rose-500 to-red-600", glow: "rgba(244,63,94,0.35)" },
];

export function SuperAdminDashboardPage() {
  const totalRes = useListSchoolsQuery({ page: 1, limit: 1 });
  const activeRes = useListSchoolsQuery({ page: 1, limit: 1, status: "ACTIVE" });
  const inactiveRes = useListSchoolsQuery({ page: 1, limit: 1, status: "INACTIVE" });
  const suspendedRes = useListSchoolsQuery({ page: 1, limit: 1, status: "SUSPENDED" });
  const recentRes = useListSchoolsQuery({ page: 1, limit: 5 });

  const counts: Record<string, number | undefined> = {
    total: totalRes.data?.meta.total,
    ACTIVE: activeRes.data?.meta.total,
    INACTIVE: inactiveRes.data?.meta.total,
    SUSPENDED: suspendedRes.data?.meta.total,
  };
  const total = counts.total ?? 0;

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8 card-shadow">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/25 to-indigo-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-emerald-300/15 to-transparent blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              <Icon name="workspace_premium" size={16} filled />
              Platform Console
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mt-1">Every school, at a glance</h1>
            <p className="text-sm text-muted mt-1.5 max-w-md">
              {totalRes.isLoading
                ? "Loading your schools…"
                : total > 0
                  ? `You're overseeing ${total} tenant${total === 1 ? "" : "s"} on Campus Ledger — each one fully isolated from the others.`
                  : "You haven't added a school yet — each one you create is fully isolated from every other."}
            </p>
          </div>
          <Link
            to="/super-admin/schools/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold px-5 py-3 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
          >
            <Icon name="add_circle" size={20} />
            New school
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="group relative bg-surface border border-line rounded-2xl p-5 card-shadow card-shadow-hover hover:-translate-y-0.5 transition-all overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{card.label}</p>
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${card.gradient} shrink-0`}
                style={{ boxShadow: `0 8px 20px -6px ${card.glow}` }}
              >
                <Icon name={card.icon} size={20} filled />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-ink font-mono mt-4 tabular-nums">{counts[card.status ?? "total"] ?? "–"}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-2xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">Recent schools</h2>
          <Link to="/super-admin/schools" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-1.5 transition-all">
            View all
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>

        {recentRes.isLoading ? (
          <div className="p-6 space-y-3">
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
          </div>
        ) : recentRes.data && recentRes.data.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {recentRes.data.data.map((school) => (
              <li key={school.id}>
                <Link to={`/super-admin/schools/${school.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-2 transition-colors group">
                  <InitialsAvatar name={school.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink group-hover:text-accent transition-colors truncate">{school.name}</p>
                    <p className="text-xs text-muted truncate hidden sm:block">{school.contactEmail}</p>
                  </div>
                  <span className="hidden md:block text-xs text-muted font-mono shrink-0">{new Date(school.createdAt).toLocaleDateString()}</span>
                  <StatusBadge status={school.status} />
                  <Icon name="chevron_right" size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">No schools yet.</p>
            <Link
              to="/super-admin/schools/new"
              className="inline-flex mt-3 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 text-xs font-semibold shadow-sm"
            >
              Create the first one <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
