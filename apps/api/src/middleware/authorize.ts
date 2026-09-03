import type { NextFunction, Request, Response } from "express";
import type { Role } from "@campus-ledger/shared-types";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

/** Route-level role allowlist — layer 3 of §06/§07. Ownership within the role is a separate, per-service check. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}
