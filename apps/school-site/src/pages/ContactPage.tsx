import { useSiteData } from "../context/SiteDataContext";

export function ContactPage() {
  const state = useSiteData();
  if (state.status !== "ready") return null;
  const { website, school } = state.site;

  const rows = [
    { label: "Email", value: website.contactEmail, href: website.contactEmail ? `mailto:${website.contactEmail}` : undefined },
    { label: "Phone", value: website.contactPhone, href: website.contactPhone ? `tel:${website.contactPhone}` : undefined },
    { label: "Address", value: website.address, href: undefined },
  ].filter((r) => r.value);

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal">Contact</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Contact {school.name}</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-muted">Contact details haven't been added yet.</p>
      ) : (
        <dl className="mt-8 grid gap-4">
          {rows.map((r) => (
            <div key={r.label} className="bg-surface border border-line rounded-xl p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{r.label}</dt>
              <dd className="mt-1 text-ink">
                {r.href ? (
                  <a href={r.href} className="hover:underline" style={{ color: "var(--brand)" }}>
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
