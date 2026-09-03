import crypto from "node:crypto";
import { prisma } from "./prisma.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

const RAW_TOKEN_BYTES = 32;

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function expiresAt(): Date {
  return new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

interface IssuedToken {
  raw: string;
  family: string;
}

/** New login → a brand new family. Rotation reuses the family it came from. */
export async function issueRefreshToken(
  userId: string,
  opts: { family?: string; userAgent?: string } = {},
): Promise<IssuedToken> {
  const raw = crypto.randomBytes(RAW_TOKEN_BYTES).toString("hex");
  const family = opts.family ?? crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      family,
      userAgent: opts.userAgent,
      expiresAt: expiresAt(),
    },
  });

  return { raw, family };
}

interface RotationResult {
  raw: string;
  userId: string;
}

/**
 * Rotates a refresh token: the presented one is revoked, a new one in
 * the same family replaces it. Presenting a token that's already been
 * rotated away (reuse — the classic theft signal) revokes the whole
 * family instead, so the stolen chain and the legitimate session both
 * stop working (§05).
 */
export async function rotateRefreshToken(rawToken: string, userAgent?: string): Promise<RotationResult> {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) throw new UnauthorizedError("Session expired — please log in again");

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    await prisma.refreshToken.updateMany({
      where: { family: existing.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError("Session expired — please log in again");
  }

  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  const next = await issueRefreshToken(existing.userId, { family: existing.family, userAgent });

  return { raw: next.raw, userId: existing.userId };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
}
