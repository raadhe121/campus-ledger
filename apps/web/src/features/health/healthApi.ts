import type { ApiSuccess } from "@campus-ledger/shared-types";
import { apiSlice } from "../../app/apiSlice";

interface HealthPayload {
  status: string;
  service: string;
  timestamp: string;
}

interface DbHealthPayload {
  status: "connected";
  latencyMs: number;
  target: string;
  doppler: { project: string; config?: string; environment?: string } | null;
}

export const healthApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<ApiSuccess<HealthPayload>, void>({
      query: () => "/health",
    }),
    // Hits /health/db, which runs `SELECT 1` through Prisma against
    // whatever DATABASE_URL the API process actually booted with —
    // proves the DB is reachable and reports whether that URL came
    // from Doppler (architecture §06's tenant DB, made observable).
    getDbHealth: builder.query<ApiSuccess<DbHealthPayload>, void>({
      query: () => "/health/db",
    }),
  }),
});

export const { useGetHealthQuery, useGetDbHealthQuery } = healthApi;
