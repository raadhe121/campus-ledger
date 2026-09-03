import { AsyncLocalStorage } from "node:async_hooks";
import type { Role } from "@campus-ledger/shared-types";

/**
 * Request-scoped tenant identity — read exactly once out of a verified
 * JWT by the `authenticate` middleware, stashed here by `tenantContext`
 * middleware for the rest of the request's async chain, and read back
 * by the Prisma extension in lib/prisma.ts and by services doing their
 * own explicit ownership checks. See architecture §06, layers 2 and 4b.
 */
export interface TenantContext {
  userId: string;
  role: Role;
  schoolId: string | null;
}

const storage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}
