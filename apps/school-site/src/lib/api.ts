import type { ApiSuccess, PublicSchoolSite } from "@campus-ledger/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

/** The one thing every deployment of this app is configured with — which school it serves. Read once, used everywhere (the fetch below, the router's basename in App.tsx). */
export const SCHOOL_SLUG: string | undefined = import.meta.env.VITE_SCHOOL_SLUG;

export async function fetchPublicSite(): Promise<PublicSchoolSite> {
  if (!SCHOOL_SLUG) {
    throw new Error("This deployment has no VITE_SCHOOL_SLUG configured — it doesn't know which school to show.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/public/schools/${SCHOOL_SLUG}`);
  } catch {
    throw new Error("Could not reach the server.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? "This school's website isn't available right now.");
  }

  const body = (await res.json()) as ApiSuccess<PublicSchoolSite>;
  return body.data;
}
