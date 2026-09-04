import { useEffect, useState, type ReactNode } from "react";
import { fetchPublicSite } from "../lib/api";
import { applyBrandColor } from "../lib/theme";
import { SiteDataContext, type SiteDataState } from "./SiteDataContext";

/**
 * Fetches one school's public content and shares it via context — every
 * page reads from here rather than each making its own request. The caller
 * (App.tsx) mounts this with `key={slug}`, so a visitor navigating from one
 * school's URL to another gets a fresh instance — state starts at
 * "loading" again for free via the initial useState, no manual reset
 * inside the effect needed — rather than one long-lived instance juggling
 * "did the slug change under me" itself. There's so little data per school
 * (one payload, no pagination, nothing a visitor writes) that a real
 * data-fetching library would be pure overhead; this is the whole
 * client-side data layer for the app.
 */
export function SiteDataProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [state, setState] = useState<SiteDataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchPublicSite(slug)
      .then((site) => {
        if (cancelled) return;
        applyBrandColor(site.website.themeColor);
        document.title = site.school.name;
        setState({ status: "ready", site });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>;
}
