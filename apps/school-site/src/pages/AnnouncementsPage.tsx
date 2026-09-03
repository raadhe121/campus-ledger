import { useSiteData } from "../context/SiteDataContext";

export function AnnouncementsPage() {
  const state = useSiteData();
  if (state.status !== "ready") return null;
  const { announcements } = state.site;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal">Notice board</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Announcements</h1>
      {announcements.length === 0 ? (
        <p className="mt-6 text-muted">No announcements yet.</p>
      ) : (
        <div className="mt-8 space-y-5">
          {announcements.map((a) => (
            <article key={a.id} className="bg-surface border border-line rounded-xl p-6">
              <p className="text-xs text-muted font-medium">{new Date(a.publishedAt).toLocaleDateString()}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{a.title}</h2>
              <p className="mt-2 text-muted whitespace-pre-wrap leading-relaxed">{a.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
