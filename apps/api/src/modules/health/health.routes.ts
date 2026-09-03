import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ data: { status: "ok", service: "@campus-ledger/api", timestamp: new Date().toISOString() } });
});

// `/health` above only proves the process booted. This proves the
// DATABASE_URL it booted with — whichever source handed it that value —
// actually resolves to a live Postgres, and says plainly whether that
// source was Doppler (`doppler run`, which stamps DOPPLER_* into the
// environment automatically) or a plain .env file (README's fallback
// path for anyone without Doppler access).
healthRouter.get("/db", async (_req, res) => {
  const startedAt = process.hrtime.bigint();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    res.json({
      data: {
        status: "connected",
        latencyMs: Math.round(latencyMs * 100) / 100,
        target: describeTarget(env.DATABASE_URL),
        doppler: env.DOPPLER_PROJECT
          ? { project: env.DOPPLER_PROJECT, config: env.DOPPLER_CONFIG, environment: env.DOPPLER_ENVIRONMENT }
          : null,
      },
    });
  } catch (err) {
    res.status(503).json({
      error: {
        code: "DB_UNAVAILABLE",
        message: "DATABASE_URL is set but the database could not be reached",
        details: err instanceof Error ? err.message : String(err),
      },
    });
  }
});

/** host:port/database — never the credentials embedded in the URL. */
function describeTarget(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
  } catch {
    return "unknown";
  }
}
