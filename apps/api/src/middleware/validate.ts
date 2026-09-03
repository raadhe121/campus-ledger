import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/** Parses `req.body` against a shared schema from @campus-ledger/validation-schemas — the one source of truth (§08). */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
