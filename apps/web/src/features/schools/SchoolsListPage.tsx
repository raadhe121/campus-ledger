import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { SchoolStatus } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { InitialsAvatar } from "../../components/InitialsAvatar";
import { useListSchoolsQuery } from "./schoolsApi";
import { StatusBadge } from "./StatusBadge";

const STATUS_TABS: { value: SchoolStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function SchoolsListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SchoolStatus | "">("");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useListSchoolsQuery({ page, status: status || undefined });

  const visible = useMemo(() => {
    const rows = data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || s.contactEmail.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted mb-1">
            <span>Home</span>
            <Icon name="chevron_right" size={14} className="mx-0.5" />
            <span className="text-ink font-medium">Schools</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Schools</h1>
        </div>
        <Link
          to="/super-admin/schools/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all self-start md:self-auto"
        >
          <Icon name="add" size={20} />
          Add School
        </Link>
      </div>

      {/* filter bar */}
      <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between card-shadow">
        <div className="relative w-full md:w-1/3">
          <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools by name or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <div className="inline-flex items-center gap-1 rounded-xl bg-surface-2 p-1 self-start md:self-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === tab.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="bg-surface border border-line rounded-2xl card-shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Icon name="error" />
            </div>
            <p className="text-sm font-medium text-rose-700 mt-3">Could not load schools.</p>
          </div>
        ) : visible.length > 0 ? (
          <ul className="divide-y divide-line">
            {visible.map((school) => (
              <li key={school.id}>
                <Link to={`/super-admin/schools/${school.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-2 transition-colors group">
                  <InitialsAvatar name={school.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink group-hover:text-accent transition-colors truncate">{school.name}</p>
                    <p className="text-xs text-muted font-mono truncate">{school.slug}</p>
                  </div>
                  <span className="hidden sm:block text-xs text-muted truncate max-w-[200px]">{school.contactEmail}</span>
                  <span className="hidden md:block text-xs text-muted font-mono shrink-0">{new Date(school.createdAt).toLocaleDateString()}</span>
                  <StatusBadge status={school.status} />
                  <Icon name="chevron_right" size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-surface-2 flex items-center justify-center text-muted">
              <Icon name="apartment" size={28} />
            </div>
            <p className="font-medium text-ink mt-3">No schools {search || status ? "match your filters" : "yet"}</p>
            {!search && !status && (
              <Link
                to="/super-admin/schools/new"
                className="inline-flex mt-4 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 text-xs font-semibold shadow-sm"
              >
                Create the first one <Icon name="arrow_forward" size={14} />
              </Link>
            )}
          </div>
        )}

        {data && data.meta.total > 0 && (
          <div className="border-t border-line px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Page <span className="font-medium text-ink">{data.meta.page}</span> of <span className="font-medium text-ink">{data.meta.totalPages}</span> ·{" "}
              <span className="font-medium text-ink">{data.meta.total}</span> school{data.meta.total === 1 ? "" : "s"} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-line text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <Icon name="chevron_left" size={18} />
              </button>
              <button
                type="button"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-line text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
