import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ValidationError } from "../lib/errors.js";

/**
 * §08's convention for payment-recording endpoints: a client retrying a
 * timed-out POST must never record the payment twice. The first request
 * for a given (school, route, key) runs normally and its response is
 * cached; a later request with the same key gets that cached response
 * played back verbatim instead of reaching the handler at all.
 */
export function idempotent(route: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("Idempotency-Key");
    if (!key) return next(new ValidationError("Idempotency-Key header is required"));

    const schoolId = req.user!.schoolId!;
    const existing = await prisma.idempotencyKey.findUnique({ where: { schoolId_route_key: { schoolId, route, key } } });
    if (existing) {
      res.status(existing.responseStatus).json(existing.responseBody);
      return;
    }

    let captured: unknown;
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      captured = body;
      return originalJson(body);
    };

    // Cached after the response is already on the wire, not before — a
    // failed cache write shouldn't turn a successful payment into a 500.
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300 || captured === undefined) return;
      prisma.idempotencyKey.create({ data: { schoolId, route, key, responseStatus: res.statusCode, responseBody: captured as never } }).catch(() => {});
    });

    next();
  };
}
