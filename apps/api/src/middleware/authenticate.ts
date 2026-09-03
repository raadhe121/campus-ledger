import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../lib/errors.js";

/**
 * Verifies the access token, then re-reads the user from the database
 * rather than trusting the token's claims wholesale — a role change, a
 * school deactivation, or a `tokenVersion` bump (forced logout, §05)
 * takes effect on the very next request, not only after the token's
 * 15-minute expiry. No tenant context exists yet at this point, so this
 * lookup runs unscoped by design (lib/prisma.ts) — it's how a caller's
 * own schoolId gets established in the first place.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) return next(new UnauthorizedError());

  try {
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: claims.sub } });

    if (!user || user.status !== "ACTIVE") return next(new UnauthorizedError());
    if (user.tokenVersion !== claims.tokenVersion) return next(new UnauthorizedError("Session no longer valid"));

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
