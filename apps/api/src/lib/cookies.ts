import type { Request, Response } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "campus_ledger_rt";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

export function setRefreshCookie(res: Response, token: string) {
  // "strict" only works when the web app and API share a site (same
  // registrable domain) — the deployed shape here is a Vercel frontend
  // calling a Render backend, two different sites, so the cookie must be
  // "none" (which itself requires `secure`) or the browser silently drops
  // it on every cross-site request and refresh just stops working. Local
  // dev stays "lax": both run on http://localhost, `secure` cookies don't
  // survive plain HTTP, and "lax" already covers same-site XHR.
  const crossSite = env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export function readRefreshCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
}
