import { useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { useLogoutMutation } from "../features/auth/authApi";
import { loggedOut } from "../features/auth/authSlice";
import { Icon } from "../components/Icon";

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export type ShellTheme = "indigo" | "amber" | "sky" | "rose" | "emerald";

// Every tenant-level role's light-chrome accent — one named palette per
// role so the *same* sidebar structure reads as "this role's own space"
// without forking a second design system per role. Literal class strings
// (not built from a template) so Tailwind's scanner picks them all up
// regardless of which one gets selected at runtime.
const THEMES: Record<ShellTheme, { badge: string; activeBg: string; activeText: string; activeBorder: string }> = {
  indigo: {
    badge: "bg-gradient-to-br from-indigo-500 to-blue-600",
    activeBg: "bg-gradient-to-r from-indigo-50 to-blue-50/40",
    activeText: "text-indigo-700",
    activeBorder: "border-indigo-500",
  },
  amber: {
    badge: "bg-gradient-to-br from-amber-500 to-orange-600",
    activeBg: "bg-gradient-to-r from-amber-50 to-orange-50/40",
    activeText: "text-amber-800",
    activeBorder: "border-amber-500",
  },
  sky: {
    badge: "bg-gradient-to-br from-sky-500 to-cyan-600",
    activeBg: "bg-gradient-to-r from-sky-50 to-cyan-50/40",
    activeText: "text-sky-700",
    activeBorder: "border-sky-500",
  },
  rose: {
    badge: "bg-gradient-to-br from-rose-500 to-pink-600",
    activeBg: "bg-gradient-to-r from-rose-50 to-pink-50/40",
    activeText: "text-rose-700",
    activeBorder: "border-rose-500",
  },
  emerald: {
    badge: "bg-gradient-to-br from-emerald-500 to-teal-600",
    activeBg: "bg-gradient-to-r from-emerald-50 to-teal-50/40",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-500",
  },
};

/**
 * The sidebar + topbar chrome shared by every role's area (Super Admin,
 * School Admin, …) — only the nav items, role label and theme differ per
 * role, so those are the only things each layout passes in. Keeps every
 * role's shell in visual lockstep with the SchoolHub design system in
 * one place.
 *
 * `dark` swaps the sidebar rail to a deep gradient chrome — reserved for
 * Super Admin's platform-level console so it reads as a distinct tier
 * from every tenant's own (light) admin area. Every other role instead
 * picks a `theme` (§UI-enhance) — the sidebar stays light and the same
 * shape, just with that role's own accent on the logo badge and the
 * active nav item, so the five tenant-level portals read as one product
 * with five personalities rather than either "all identical" or "five
 * unrelated redesigns." The topbar and every page's own content stay on
 * the same light tokens regardless of `dark`/`theme`.
 */
export function AppShell({
  roleLabel,
  nav,
  brandBadge,
  dark = false,
  theme = "indigo",
}: {
  roleLabel: string;
  nav: NavItem[];
  brandBadge?: ReactNode;
  dark?: boolean;
  theme?: ShellTheme;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [logout] = useLogoutMutation();
  const [collapsed, setCollapsed] = useState(false);
  const t = THEMES[theme];

  const asideBg = dark ? "bg-gradient-to-b from-[#0a0e1a] via-[#0c1120] to-[#0a0e1a]" : "bg-paper";
  const asideBorder = dark ? "border-white/[0.08]" : "border-line";
  const brandText = dark ? "text-white" : "text-ink";
  const brandSubtext = dark ? "text-slate-500" : "text-muted";
  const navDefault = dark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-muted hover:bg-surface-2 hover:text-ink";
  const navActive = dark
    ? "bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent text-white border-l-4 border-violet-400 lg:pl-2.5 font-semibold shadow-[inset_0_0_20px_-8px_rgba(139,92,246,0.5)]"
    : `${t.activeBg} ${t.activeText} border-l-4 ${t.activeBorder} lg:pl-2.5 font-semibold`;
  const footerBorder = dark ? "border-white/[0.08]" : "border-line";
  const logoBadge = dark ? "bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 shadow-[0_0_24px_-4px_rgba(139,92,246,0.65)]" : `${t.badge} shadow-sm`;

  return (
    <div className={`min-h-screen bg-paper lg:grid ${collapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[280px_1fr]"} transition-[grid-template-columns] duration-200`}>
      {/* sidebar */}
      <aside className={`border-b lg:border-b-0 lg:border-r ${asideBorder} ${asideBg} lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex lg:flex-col`}>
        <div className={`flex items-center gap-3 px-4 py-4 lg:px-5 lg:py-5 ${collapsed ? "lg:justify-center lg:px-3" : ""}`}>
          <div className={`h-10 w-10 shrink-0 rounded-xl text-white flex items-center justify-center font-bold text-sm ${logoBadge}`}>SH</div>
          {!collapsed && (
            <div className="min-w-0 hidden sm:block lg:block">
              <p className={`font-bold tracking-tight text-base leading-none ${brandText}`}>SchoolHub</p>
              <p className={`text-xs mt-1 truncate ${brandSubtext}`}>{roleLabel}</p>
            </div>
          )}
        </div>

        <nav className={`px-2 lg:px-3 py-1 flex-1 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible ${collapsed ? "lg:items-center" : ""}`}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `inline-flex lg:flex items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors shrink-0 ${
                  collapsed ? "lg:justify-center lg:px-2.5 lg:w-11" : ""
                } ${isActive ? navActive : `${navDefault} border-l-4 border-transparent lg:pl-2.5`}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`hidden lg:flex flex-col gap-1 border-t ${footerBorder} p-2 lg:p-3 ${collapsed ? "items-center" : ""}`}>
          {brandBadge}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${navDefault} ${collapsed ? "justify-center px-2.5 w-11" : "w-full"}`}
          >
            <Icon name={collapsed ? "menu" : "menu_open"} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-paper/85 border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-9 w-9 shrink-0 rounded-full text-white flex items-center justify-center text-xs font-bold ${dark ? "bg-gradient-to-br from-indigo-400 to-violet-500" : t.badge}`}>
              {(user?.firstName?.[0] ?? "?") + (user?.lastName?.[0] ?? "")}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-ink truncate leading-tight">{user ? `${user.firstName} ${user.lastName}` : ""}</p>
              <p className="text-xs text-muted truncate leading-tight">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout().finally(() => dispatch(loggedOut()))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors shrink-0"
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
