import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── types ──────────────────────────────────────────────────────────
type Category =
  | "All"
  | "Auth"
  | "Super Admin"
  | "School Admin"
  | "Academics"
  | "People"
  | "Enrollment"
  | "Dev Tools"
  | "System"
  | "Layouts"
  | "Components";

type ViewMode = "grid" | "list";

interface Design {
  id: string;
  title: string;
  path: string;
  category: Category;
  description: string;
  icon: string;
  file: string;
  status: "live" | "protected" | "wip";
  tags: string[];
  accent: string;
}

// ─── data — every page / layout / component in apps/web ───────────
const DESIGNS: Design[] = [
  // Auth
  {
    id: "login",
    title: "Login",
    path: "/login",
    category: "Auth",
    description: "Credential sign-in with Zod validation, role-aware redirect and error callout.",
    icon: "🔐",
    file: "features/auth/LoginPage.tsx",
    status: "live",
    tags: ["form", "zod", "public"],
    accent: "from-emerald-500 to-teal-600",
  },
  // Super Admin
  {
    id: "sa-schools",
    title: "Schools List",
    path: "/super-admin/schools",
    category: "Super Admin",
    description: "Paginated table of all schools with search, status badges and detail links.",
    icon: "🏫",
    file: "features/schools/SchoolsListPage.tsx",
    status: "protected",
    tags: ["table", "pagination"],
    accent: "from-violet-500 to-indigo-600",
  },
  {
    id: "sa-schools-new",
    title: "Create School",
    path: "/super-admin/schools/new",
    category: "Super Admin",
    description: "Multi-field creation form — name, code, address with inline validation.",
    icon: "➕",
    file: "features/schools/CreateSchoolPage.tsx",
    status: "protected",
    tags: ["form", "create"],
    accent: "from-violet-500 to-indigo-600",
  },
  {
    id: "sa-school-detail",
    title: "School Detail",
    path: "/super-admin/schools/:schoolId",
    category: "Super Admin",
    description: "Single-school overview with metadata, stats and admin assignment.",
    icon: "🏛️",
    file: "features/schools/SchoolDetailPage.tsx",
    status: "protected",
    tags: ["detail", "dynamic"],
    accent: "from-violet-500 to-indigo-600",
  },
  // School Admin — Dashboard
  {
    id: "sa-dashboard",
    title: "School Admin Dashboard",
    path: "/school-admin",
    category: "School Admin",
    description: "Stat-card grid with live counts, active-year banner and setup callout.",
    icon: "📊",
    file: "features/dashboard/SchoolAdminDashboardPage.tsx",
    status: "protected",
    tags: ["dashboard", "stats"],
    accent: "from-amber-500 to-orange-600",
  },
  // Academics
  {
    id: "ac-years",
    title: "Academic Years",
    path: "/school-admin/academic-years",
    category: "Academics",
    description: "Year timeline with active-year toggle, CRUD table and create form.",
    icon: "📅",
    file: "features/academics/AcademicYearsPage.tsx",
    status: "protected",
    tags: ["timeline", "crud"],
    accent: "from-sky-500 to-cyan-600",
  },
  {
    id: "ac-classes",
    title: "Classes",
    path: "/school-admin/classes",
    category: "Academics",
    description: "Classes grouped under a year selector — ordered list with delete.",
    icon: "📚",
    file: "features/academics/ClassesPage.tsx",
    status: "protected",
    tags: ["table", "year-scoped"],
    accent: "from-sky-500 to-cyan-600",
  },
  {
    id: "ac-sections",
    title: "Sections",
    path: "/school-admin/sections",
    category: "Academics",
    description: "Sections nested inside a class, filtered by academic year and class.",
    icon: "🧩",
    file: "features/academics/SectionsPage.tsx",
    status: "protected",
    tags: ["nested", "filter"],
    accent: "from-sky-500 to-cyan-600",
  },
  {
    id: "ac-subjects",
    title: "Subjects",
    path: "/school-admin/subjects",
    category: "Academics",
    description: "Subject catalogue with code, name and class association.",
    icon: "📝",
    file: "features/academics/SubjectsPage.tsx",
    status: "protected",
    tags: ["catalogue", "crud"],
    accent: "from-sky-500 to-cyan-600",
  },
  // People
  {
    id: "p-teachers",
    title: "Teachers",
    path: "/school-admin/teachers",
    category: "People",
    description: "Teacher roster with temp-password callout, status toggle and invite form.",
    icon: "👩‍🏫",
    file: "features/people/TeachersPage.tsx",
    status: "protected",
    tags: ["roster", "invite"],
    accent: "from-rose-500 to-pink-600",
  },
  {
    id: "p-students",
    title: "Students",
    path: "/school-admin/students",
    category: "People",
    description: "Student admission table — admission no., DOB, blood group, status badge.",
    icon: "🎓",
    file: "features/people/StudentsPage.tsx",
    status: "protected",
    tags: ["admission", "roster"],
    accent: "from-rose-500 to-pink-600",
  },
  {
    id: "p-parents",
    title: "Parents",
    path: "/school-admin/parents",
    category: "People",
    description: "Parent directory linked to student profiles with contact info.",
    icon: "👨‍👩‍👧",
    file: "features/people/ParentsPage.tsx",
    status: "protected",
    tags: ["directory", "link"],
    accent: "from-rose-500 to-pink-600",
  },
  {
    id: "p-staff",
    title: "Staff",
    path: "/school-admin/staff",
    category: "People",
    description: "Non-teaching staff management with role and department fields.",
    icon: "🧑‍💼",
    file: "features/people/StaffPage.tsx",
    status: "protected",
    tags: ["staff", "directory"],
    accent: "from-rose-500 to-pink-600",
  },
  // Enrollment
  {
    id: "enrollment",
    title: "Enrollment",
    path: "/school-admin/enrollment",
    category: "Enrollment",
    description: "Year-scoped enrollment matrix — transfer, withdraw, roll-no assignment.",
    icon: "📋",
    file: "features/enrollment/EnrollmentPage.tsx",
    status: "protected",
    tags: ["matrix", "workflow"],
    accent: "from-emerald-500 to-teal-600",
  },
  // Dev Tools
  {
    id: "dev-audio",
    title: "Audio → Text",
    path: "/dev/audio-to-text",
    category: "Dev Tools",
    description: "Upload or record audio, transcribe via API — waveform preview included.",
    icon: "🎙️",
    file: "features/dev-tools/AudioToTextPage.tsx",
    status: "live",
    tags: ["audio", "ai"],
    accent: "from-zinc-700 to-zinc-900",
  },
  // System
  {
    id: "status",
    title: "System Health",
    path: "/status",
    category: "System",
    description: "Two independent RTK Query checks — API and Postgres with Doppler badge.",
    icon: "💚",
    file: "features/health/StatusPage.tsx",
    status: "live",
    tags: ["health", "rtk-query"],
    accent: "from-green-500 to-emerald-600",
  },
  {
    id: "forbidden",
    title: "403 Forbidden",
    path: "/forbidden",
    category: "System",
    description: "Role-guard fallback — centered message with sign-out when authenticated.",
    icon: "🚫",
    file: "routes/InfoPages.tsx",
    status: "live",
    tags: ["guard", "error"],
    accent: "from-red-500 to-rose-600",
  },
  {
    id: "coming-soon",
    title: "Coming Soon",
    path: "/coming-soon",
    category: "System",
    description: "Placeholder for roles whose dashboards are not built yet (Teacher, Parent…).",
    icon: "🚧",
    file: "routes/InfoPages.tsx",
    status: "live",
    tags: ["placeholder"],
    accent: "from-amber-500 to-yellow-600",
  },
  // Layouts
  {
    id: "layout-root",
    title: "Root Layout",
    path: "(layout) RootLayout",
    category: "Layouts",
    description: "Minimal shell — Campus Ledger header with Outlet, used by /status.",
    icon: "🧱",
    file: "layouts/RootLayout.tsx",
    status: "live",
    tags: ["layout", "shell"],
    accent: "from-slate-500 to-slate-700",
  },
  {
    id: "layout-super",
    title: "Super Admin Layout",
    path: "(layout) SuperAdminLayout",
    category: "Layouts",
    description: "220 px sidebar nav + header + Outlet — Schools / Settings.",
    icon: "🏗️",
    file: "layouts/SuperAdminLayout.tsx",
    status: "live",
    tags: ["layout", "sidebar"],
    accent: "from-slate-500 to-slate-700",
  },
  {
    id: "layout-school",
    title: "School Admin Layout",
    path: "(layout) SchoolAdminLayout",
    category: "Layouts",
    description: "Responsive sidebar with 11 nav items, collapses to top-bar on mobile.",
    icon: "🏗️",
    file: "layouts/SchoolAdminLayout.tsx",
    status: "live",
    tags: ["layout", "responsive"],
    accent: "from-slate-500 to-slate-700",
  },
  // Components
  {
    id: "comp-checkcard",
    title: "CheckCard",
    path: "(component) CheckCard",
    category: "Components",
    description: "Shared health-check card — loading / error / success states with retry.",
    icon: "🧩",
    file: "features/health/CheckCard.tsx",
    status: "live",
    tags: ["card", "shared"],
    accent: "from-teal-500 to-cyan-600",
  },
  {
    id: "comp-statusbadge",
    title: "PersonStatusBadge",
    path: "(component) PersonStatusBadge",
    category: "Components",
    description: "Pill badge for ACTIVE / DISABLED user status — accent vs muted.",
    icon: "🏷️",
    file: "components/PersonStatusBadge.tsx",
    status: "live",
    tags: ["badge", "shared"],
    accent: "from-teal-500 to-cyan-600",
  },
  {
    id: "comp-temp-pw",
    title: "TempPasswordCallout",
    path: "(component) TempPasswordCallout",
    category: "Components",
    description: "Dismissible callout showing email + one-time temp password after creation.",
    icon: "🔑",
    file: "components/TempPasswordCallout.tsx",
    status: "live",
    tags: ["callout", "shared"],
    accent: "from-teal-500 to-cyan-600",
  },
];

const CATEGORIES: Category[] = [
  "All",
  "Auth",
  "Super Admin",
  "School Admin",
  "Academics",
  "People",
  "Enrollment",
  "Dev Tools",
  "System",
  "Layouts",
  "Components",
];

const STATUS_LABEL: Record<Design["status"], { text: string; cls: string }> = {
  live: { text: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  protected: { text: "Auth", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  wip: { text: "WIP", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

// ─── helpers ────────────────────────────────────────────────────────
function isNavigable(d: Design) {
  return d.path.startsWith("/");
}

// ─── page ───────────────────────────────────────────────────────────
export function DesignsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [view, setView] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<Design["status"] | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DESIGNS.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.path.toLowerCase().includes(q) ||
        d.file.toLowerCase().includes(q) ||
        d.tags.some((t) => t.includes(q))
      );
    });
  }, [query, category, statusFilter]);

  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    for (const d of DESIGNS) m.set(d.category, (m.get(d.category) ?? 0) + 1);
    return m;
  }, []);

  function copyPath(path: string) {
    navigator.clipboard.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-paper/80 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full border border-accent text-accent flex items-center justify-center font-semibold text-sm shrink-0">
              CL
            </div>
            <span className="font-semibold text-ink truncate">Campus Ledger</span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-accent text-accent-ink text-[10px] font-bold tracking-widest px-2 py-0.5">
              DESIGNS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/status"
              className="rounded-full bg-accent text-accent-ink px-4 py-1.5 text-sm font-medium hover:bg-accent-strong transition-colors"
            >
              Health
            </Link>
          </div>
        </div>
      </header>

      {/* ── hero ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 relative overflow-hidden">
          {/* soft gradient blob */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-accent/15 via-gold/15 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-violet-500/10 to-transparent blur-2xl" />

          <div className="relative">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gold font-semibold">
              apps/web · {DESIGNS.length} designs indexed
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-tight">
              All designs — interactive gallery
            </h1>
            <p className="mt-2 text-sm sm:text-[15px] leading-6 text-muted max-w-2xl">
              Browse every page, layout and shared component in the web app. Search, filter by module, switch between grid and list, and jump straight into any route.
            </p>

            {/* stats row */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: "Pages", value: DESIGNS.filter((d) => d.path.startsWith("/")).length },
                { label: "Layouts", value: DESIGNS.filter((d) => d.category === "Layouts").length },
                { label: "Components", value: DESIGNS.filter((d) => d.category === "Components").length },
                { label: "Protected", value: DESIGNS.filter((d) => d.status === "protected").length },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink"
                >
                  <span className="font-mono font-bold">{s.value}</span>
                  <span className="text-muted">{s.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── controls ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          {/* search */}
          <div className="relative flex-1 max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, path, file, tag…  (e.g. enrollment, /login, crud)"
              className="w-full rounded-full border border-line bg-surface pl-9 pr-4 py-2.5 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          {/* view + status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-full border border-line bg-surface p-1">
              {[
                { id: "grid" as const, label: "Grid", icon: "▦" },
                { id: "list" as const, label: "List", icon: "☰" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setView(m.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    view === m.id ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as never)}
              className="rounded-full border border-line bg-surface px-3 py-2 text-xs font-medium text-ink"
            >
              <option value="all">All statuses</option>
              <option value="live">Live only</option>
              <option value="protected">Protected only</option>
            </select>
          </div>
        </div>

        {/* category pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = category === c;
            const count = c === "All" ? DESIGNS.length : (counts.get(c as Category) ?? 0);
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-surface text-ink border-line hover:bg-surface-2"
                }`}
              >
                {c}
                <span
                  className={`rounded-full px-1.5 py-0 text-[10px] font-mono font-bold ${
                    active ? "bg-white/20 text-accent-ink" : "bg-surface-2 text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* result meta */}
        <p className="mt-4 text-xs font-mono text-muted">
          Showing <span className="font-bold text-ink">{filtered.length}</span> of {DESIGNS.length} designs
          {query && (
            <>
              {" "}
              for <span className="text-ink">“{query}”</span>
            </>
          )}
          {category !== "All" && (
            <>
              {" "}
              in <span className="text-ink">{category}</span>
            </>
          )}
        </p>
      </div>

      {/* ── grid / list ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-16">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 font-medium text-ink">No designs match</p>
            <p className="text-sm text-muted mt-1">Try a different search or category.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
                setStatusFilter("all");
              }}
              className="mt-4 rounded-full bg-accent text-accent-ink px-4 py-2 text-sm font-medium hover:bg-accent-strong"
            >
              Reset filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <article
                key={d.id}
                onClick={() => isNavigable(d) && navigate(d.path)}
                className={`group relative rounded-2xl border border-line bg-surface overflow-hidden flex flex-col text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  isNavigable(d) ? "cursor-pointer hover:border-accent/30" : ""
                }`}
              >
                {/* accent top bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${d.accent}`} />

                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-9 w-9 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-lg leading-none">
                      {d.icon}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest ${STATUS_LABEL[d.status].cls}`}>
                      {STATUS_LABEL[d.status].text}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-ink leading-tight group-hover:text-accent-strong transition-colors">{d.title}</h3>
                    <p className="mt-1 text-xs font-mono text-muted break-all">{d.path}</p>
                  </div>

                  <p className="text-sm leading-5 text-muted line-clamp-2">{d.description}</p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.tags.map((t) => (
                      <span key={t} className="rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[10px] font-mono text-muted">
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className="mt-auto pt-3 text-[11px] font-mono text-muted truncate border-t border-line">{d.file}</p>
                </div>

                {/* actions */}
                <div className="px-5 pb-4 flex items-center gap-2">
                  {isNavigable(d) ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong group-hover:underline">
                        Open <span aria-hidden>→</span>
                      </span>
                      <span className="mx-1 h-3 w-px bg-line" />
                    </>
                  ) : (
                    <span className="text-xs text-muted">Layout / Component</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPath(d.path);
                    }}
                    className="ml-auto text-xs font-medium text-muted hover:text-ink"
                  >
                    {copied === d.path ? "Copied ✓" : "Copy path"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line">
            {filtered.map((d) => (
              <div
                key={d.id}
                onClick={() => isNavigable(d) && navigate(d.path)}
                className={`flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-surface-2/60 transition-colors ${isNavigable(d) ? "cursor-pointer" : ""}`}
              >
                <div className={`hidden sm:flex h-1 self-stretch w-1 rounded-full bg-gradient-to-b ${d.accent}`} />
                <div className="h-8 w-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-base shrink-0">
                  {d.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink text-sm">{d.title}</span>
                    <span className="text-xs font-mono text-muted truncate">{d.path}</span>
                    <span className={`hidden sm:inline-flex rounded-full border px-1.5 py-0 text-[10px] font-bold tracking-widest ${STATUS_LABEL[d.status].cls}`}>
                      {STATUS_LABEL[d.status].text}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted truncate mt-0.5">{d.description}</p>
                  <p className="text-[11px] font-mono text-muted/70 truncate">{d.file}</p>
                </div>
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  {d.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[10px] font-mono text-muted">
                      {t}
                    </span>
                  ))}
                </div>
                {isNavigable(d) ? (
                  <span className="shrink-0 hidden sm:inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-2">
                    Open →
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-mono text-muted border border-line rounded-full px-2 py-1">PREVIEW</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* footer help */}
        <div className="mt-8 rounded-xl border border-line bg-surface p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">
            <span className="font-semibold text-ink">Tip:</span> Protected routes (amber badge) need a signed-in session. Use{" "}
            <code className="font-mono bg-surface-2 border border-line px-1 py-0.5 rounded">/login</code> first, or browse as layout/component.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2">
              Role redirect →
            </Link>
            <Link to="/status" className="rounded-full bg-accent text-accent-ink px-3 py-1.5 text-xs font-medium hover:bg-accent-strong">
              System health
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
