import jwt from "jsonwebtoken";
import type { Role } from "@campus-ledger/shared-types";
import { env } from "../config/env.js";

export interface AccessTokenClaims {
  sub: string; // userId
  role: Role;
  schoolId: string | null;
  tokenVersion: number;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

/** Throws jsonwebtoken's own errors (TokenExpiredError, JsonWebTokenError) — callers map those to 401. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenClaims;
}
