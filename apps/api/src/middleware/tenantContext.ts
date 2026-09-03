import type { NextFunction, Request, Response } from "express";
import { runWithTenantContext } from "../lib/tenantContext.js";
import { UnauthorizedError } from "../lib/errors.js";

/** Must run after `authenticate` — establishes the tenant identity every downstream layer in §06 reads. */
export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());

  runWithTenantContext({ userId: req.user.id, role: req.user.role, schoolId: req.user.schoolId }, () => next());
}
