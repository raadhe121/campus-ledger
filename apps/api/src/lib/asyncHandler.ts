import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 doesn't route a rejected promise from an async handler to
 * `errorHandler` on its own — every async controller in this codebase
 * gets wrapped with this rather than each one adding its own try/catch.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
