import { useSiteData } from "../context/SiteDataContext";

export function AboutPage() {
  const state = useSiteData();
  if (state.status !== "ready") return null;
  const { website, school } = state.site;

  return (
    <div>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal">About</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">About {school.name}</h1>
        {website.aboutText ? <p className="mt-6 text-muted leading-relaxed whitespace-pre-wrap">{website.aboutText}</p> : <p className="mt-6 text-muted">This school hasn't added an About section yet.</p>}
      </div>

      {website.philosophyText && (
        <section className="bg-surface-2/60 border-y border-line">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            {website.philosophyImageUrl ? (
              <img src={website.philosophyImageUrl} alt="" className="h-24 w-24 rounded-full object-cover shrink-0 mx-auto sm:mx-0 border-4 border-surface shadow-sm" />
            ) : (
              <span className="h-24 w-24 rounded-full shrink-0 mx-auto sm:mx-0 flex items-center justify-center text-white font-display text-2xl font-semibold" style={{ backgroundColor: "var(--brand)" }}>
                {school.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">Our philosophy</p>
              <blockquote className="mt-2 font-display text-lg text-ink leading-relaxed border-l-4 pl-5" style={{ borderColor: "var(--brand)" }}>
                {website.philosophyText}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {website.highlights.length > 0 && (
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">Recognition</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Achievements & highlights</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
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
        </div>
      )}
    </div>
  );
}
