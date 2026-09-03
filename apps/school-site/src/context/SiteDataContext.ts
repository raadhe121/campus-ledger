import { createContext, useContext } from "react";
import type { PublicSchoolSite } from "@campus-ledger/shared-types";

export type SiteDataState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; site: PublicSchoolSite };

export const SiteDataContext = createContext<SiteDataState>({ status: "loading" });

export function useSiteData(): SiteDataState {
  return useContext(SiteDataContext);
}
