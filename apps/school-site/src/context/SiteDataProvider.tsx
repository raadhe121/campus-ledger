import { useEffect, useState, type ReactNode } from "react";
import { fetchPublicSite } from "../lib/api";
import { applyBrandColor } from "../lib/theme";
import { SiteDataContext, type SiteDataState } from "./SiteDataContext";

/**
 * Fetches this deployment's one school's public content exactly once, on
 * mount, and shares it via context — every page reads from here rather
 * than each making its own request. There's so little data (one payload,
 * no pagination, nothing a visitor writes) that a real data-fetching
 * library would be pure overhead; this is the whole client-side data
 * layer for the app.
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteDataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchPublicSite()
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
  }, []);

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>;
}
