import { Link } from "react-router-dom";
import { useSiteData } from "../context/SiteDataContext";

export function AdmissionsPage() {
  const state = useSiteData();
  if (state.status !== "ready") return null;
  const { website, school } = state.site;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal">Admissions</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Admissions at {school.name}</h1>
      {website.admissionsText ? (
        <p className="mt-6 text-muted leading-relaxed whitespace-pre-wrap">{website.admissionsText}</p>
      ) : (
        <p className="mt-6 text-muted">Admissions information hasn't been added yet.</p>
      )}
      {(website.contactEmail || website.contactPhone) && (
        <p className="mt-8 text-sm text-muted">
          Questions?{" "}
          <Link to="contact" className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>
            Get in touch
          </Link>
          .
        </p>
      )}
    </div>
  );
}
