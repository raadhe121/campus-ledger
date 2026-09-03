import { Link } from "react-router-dom";
import { useSiteData } from "../context/SiteDataContext";

export function HomePage() {
  const state = useSiteData();
  if (state.status !== "ready") return null;
  const { site } = state;
  const { website } = site;
  const latest = site.announcements.slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
        {website.heroImageUrl && <img src={website.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center" style={{ color: "var(--brand-ink)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">Welcome to</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">{site.school.name}</h1>
          {website.tagline && <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">{website.tagline}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="admissions" className="rounded-md bg-white px-6 py-2.5 text-sm font-semibold shadow-sm" style={{ color: "var(--brand)" }}>
              Admissions
            </Link>
            <Link to="contact" className="rounded-md border border-white/40 px-6 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Stat counters — a school's own "at a glance" trust bar, floating over the hero's bottom edge the way an institutional site's homepage usually leads. */}
      {website.stats.length > 0 && (
        <section className="bg-navy">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {website.stats.map((s) => (
              <div key={s.title}>
                <p className="font-display text-3xl sm:text-4xl font-semibold text-white">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {website.aboutText && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">About us</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Who we are</h2>
          <p className="mt-4 text-muted leading-relaxed whitespace-pre-wrap">{website.aboutText}</p>
        </section>
      )}

      {/* Philosophy / leadership message — a portrait + a short statement, the "message from our principal" block most school sites carry. */}
      {website.philosophyText && (
        <section className="bg-surface-2/60 border-y border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 grid sm:grid-cols-[auto_1fr] gap-8 items-start">
            {website.philosophyImageUrl ? (
              <img src={website.philosophyImageUrl} alt="" className="h-32 w-32 rounded-full object-cover shrink-0 mx-auto sm:mx-0 border-4 border-surface shadow-sm" />
            ) : (
              <span className="h-32 w-32 rounded-full shrink-0 mx-auto sm:mx-0 flex items-center justify-center text-white font-display text-3xl font-semibold" style={{ backgroundColor: "var(--brand)" }}>
                {site.school.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">Our philosophy</p>
              <blockquote className="mt-2 font-display text-xl text-ink leading-relaxed border-l-4 pl-5" style={{ borderColor: "var(--brand)" }}>
                {website.philosophyText}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {/* Achievements & highlights grid. */}
      {website.highlights.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">Recognition</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Achievements & highlights</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {website.highlights.map((h) => (
              <div key={h.title} className="rounded-xl border border-line bg-surface p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: "var(--brand)" }}>
                  ✓
                </span>
                <p className="mt-3 font-semibold text-ink">{h.title}</p>
                {h.description && <p className="mt-1.5 text-sm text-muted leading-relaxed">{h.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Programs / stages on offer. */}
      {website.programs.length > 0 && (
        <section className="bg-surface-2/60 border-y border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">Academics</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Programs</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {website.programs.map((p, i) => (
                <div key={p.title} className="rounded-xl border border-line bg-surface p-5">
                  <span className="font-display text-2xl font-semibold text-teal">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-2 font-semibold text-ink">{p.title}</p>
                  {p.description && <p className="mt-1.5 text-sm text-muted leading-relaxed">{p.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Campuses, only when a school actually has more than one location worth listing. */}
      {website.campuses.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">Locations</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Our campuses</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {website.campuses.map((c) => (
              <div key={c.name} className="rounded-xl border border-line bg-surface p-5">
                <p className="font-semibold text-ink">{c.name}</p>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{c.address}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="bg-surface-2/60 border-t border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink">Latest announcements</h2>
              <Link to="announcements" className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                View all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {latest.map((a) => (
                <div key={a.id} className="bg-surface border border-line rounded-xl p-5">
                  <p className="text-xs text-muted font-medium">{new Date(a.publishedAt).toLocaleDateString()}</p>
                  <p className="mt-1.5 font-semibold text-ink">{a.title}</p>
                  <p className="mt-1.5 text-sm text-muted line-clamp-3">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing admissions call-to-action. */}
      <section style={{ backgroundColor: "var(--brand)" }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 text-center" style={{ color: "var(--brand-ink)" }}>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Admissions are open</h2>
          <p className="mt-3 opacity-90 max-w-lg mx-auto">Join {site.school.name} and become part of our community.</p>
          <Link to="admissions" className="mt-6 inline-block rounded-md bg-white px-6 py-2.5 text-sm font-semibold shadow-sm" style={{ color: "var(--brand)" }}>
            Learn about admissions
          </Link>
        </div>
      </section>
    </div>
  );
}
