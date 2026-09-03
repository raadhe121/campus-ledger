import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { setRefreshCookie, clearRefreshCookie, readRefreshCookie } from "../../lib/cookies.js";
import { UnauthorizedError } from "../../lib/errors.js";

export async function loginHandler(req: Request, res: Response) {
  const session = await authService.login(req.body, req.headers["user-agent"]);
  setRefreshCookie(res, session.refreshToken);
  res.json({ data: { user: session.user, accessToken: session.accessToken } });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = readRefreshCookie(req);
  if (!token) throw new UnauthorizedError("No session to refresh");

  const session = await authService.refresh(token, req.headers["user-agent"]);
  setRefreshCookie(res, session.refreshToken);
  res.json({ data: { user: session.user, accessToken: session.accessToken } });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = readRefreshCookie(req);
  if (token) await authService.logout(token);
  clearRefreshCookie(res);
  res.status(204).send();
}

export function meHandler(req: Request, res: Response) {
  // `authenticate` already re-fetched this from the database — no
  // second query needed just to echo the session back.
  res.json({ data: { user: req.user } });
}
