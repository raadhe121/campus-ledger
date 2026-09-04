import type { ApiSuccess, PublicSchoolSite } from "@campus-ledger/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Which school this deployment shows at the bare "/" root — optional. Most
 * deployments don't need this at all: the slug in the URL path (`/:slug`)
 * is what actually picks the school, resolved fresh on every request, so
 * one deployment already serves any number of schools with no rebuild
 * needed when a new one is added. This only matters if you want a bare
 * domain root (e.g. a school's own custom domain) to skip straight to
 * their content instead of showing the "which school?" landing page.
 */
export const DEFAULT_SCHOOL_SLUG: string | undefined = import.meta.env.VITE_SCHOOL_SLUG;

export async function fetchPublicSite(slug: string): Promise<PublicSchoolSite> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/public/schools/${slug}`);
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
