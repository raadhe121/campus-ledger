import { Link, NavLink, Outlet } from "react-router-dom";
import { useSiteData } from "../context/SiteDataContext";

const NAV = [
  { to: "", label: "Home" },
  { to: "about", label: "About" },
  { to: "admissions", label: "Admissions" },
  { to: "announcements", label: "Announcements" },
  { to: "contact", label: "Contact" },
];

/** The chrome every page sits inside — ticker + utility bar + nav + footer, gated on the site data actually being ready so no page has to repeat the loading/error handling. */
export function SiteLayout() {
  const state = useSiteData();

  if (state.status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <p className="font-display text-2xl font-semibold text-ink">This site isn't available</p>
          <p className="text-sm text-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  const { site } = state;
  const { website } = site;
  const latestAnnouncements = site.announcements.slice(0, 4);
  const hasContact = website.contactEmail || website.contactPhone || website.address;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrolling announcement strip — the "ticker" a school site like this leads with, so news doesn't wait for a visitor to find the Announcements page. */}
      {latestAnnouncements.length > 0 && (
        <div className="bg-navy text-white text-xs overflow-hidden" aria-label="Latest announcements">
          <div className="flex items-stretch">
            <span className="shrink-0 bg-teal px-3 py-2 font-semibold uppercase tracking-wide">Notice board</span>
            <div className="flex-1 overflow-hidden whitespace-nowrap py-2">
              <div className="ticker-track inline-flex w-max gap-16 pl-6">
                {[...latestAnnouncements, ...latestAnnouncements].map((a, i) => (
                  <Link key={`${a.id}-${i}`} to="announcements" className="hover:underline">
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Utility bar — contact details, the way a formal institutional site puts them above the fold on every page. */}
      {hasContact && (
        <div className="bg-navy-2 text-white/85 text-xs">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-1.5 flex flex-wrap items-center gap-x-6 gap-y-1">
            {website.contactPhone && <span>☎ {website.contactPhone}</span>}
            {website.contactEmail && <span>✉ {website.contactEmail}</span>}
            {website.address && <span className="truncate">{website.address}</span>}
          </div>
        </div>
      )}

      <header className="border-b border-line bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="" className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg flex items-center justify-center font-display font-bold text-sm text-white shrink-0" style={{ backgroundColor: "var(--brand)" }}>
              {site.school.name.slice(0, 1)}
            </span>
            <span className="font-display text-lg font-semibold text-ink leading-tight">{site.school.name}</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium flex-wrap">
            {NAV.map((item) => (
              <NavLink
                key={item.to || "home"}
                to={item.to}
                end={item.to === ""}
                className={({ isActive }) => `rounded-md px-3.5 py-2 transition-colors ${isActive ? "text-[var(--brand-ink)]" : "text-muted hover:text-ink"}`}
                style={({ isActive }) => (isActive ? { backgroundColor: "var(--brand)" } : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="admissions" className="ml-1 rounded-md bg-gold px-4 py-2 text-white font-semibold hover:opacity-90 transition-opacity">
              Apply now
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy text-white/80 text-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">{site.school.name}</p>
            {website.tagline && <p className="mt-3 leading-relaxed text-white/70">{website.tagline}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Quick links</p>
            <ul className="mt-3 space-y-2">
              {NAV.slice(1).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {website.programs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Programs</p>
              <ul className="mt-3 space-y-2">
                {website.programs.slice(0, 5).map((p) => (
                  <li key={p.title}>{p.title}</li>
                ))}
              </ul>
            </div>
          )}

          {hasContact && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Contact</p>
              <ul className="mt-3 space-y-2">
                {website.address && <li>{website.address}</li>}
                {website.contactPhone && <li>{website.contactPhone}</li>}
                {website.contactEmail && <li>{website.contactEmail}</li>}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 text-xs text-white/50 flex flex-wrap items-center justify-between gap-2">
            <p>
              © {new Date().getFullYear()} {site.school.name}. All rights reserved.
            </p>
            <p>Powered by Campus Ledger</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
