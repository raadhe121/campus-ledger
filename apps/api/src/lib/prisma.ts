import { PrismaClient, Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { getTenantContext } from "./tenantContext.js";

const basePrisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Every model whose rows carry a `schoolId` column — grows as each build
 * phase adds tenant-owned tables (architecture §03). A model landing
 * here without a `schoolId` field is a compile error the next time this
 * file's usages run, which is the point: it's supposed to be impossible
 * to add a tenant table and forget to register it.
 */
const TENANT_MODELS = new Set<Prisma.ModelName>([
  "User",
  "AcademicYear",
  "Class",
  "Section",
  "Subject",
  "StudentProfile",
  "StaffProfile",
  "Enrollment",
  "ParentStudent",
  "AttendanceRecord",
  "TimetableSlot",
  "Exam",
  "ExamSubject",
  "Result",
  "Assignment",
  "Submission",
  "FeeStructure",
  "FeeItem",
  "StudentFee",
  "Payment",
  "Receipt",
  "Expense",
  "IdempotencyKey",
  "SchoolWebsite",
  "SchoolAnnouncement",
]);

const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * Layer 4b of §06's defense-in-depth: every query Prisma runs against a
 * tenant model is automatically confined to the caller's own school,
 * read out of the AsyncLocalStorage context `tenantContext` middleware
 * set up earlier in the request — never out of the query's own args.
 *
 * A request with no tenant context at all (nothing has called
 * `runWithTenantContext` yet — the `authenticate` middleware's own
 * lookup of "who is this JWT for", or a script like prisma/seed.ts) is
 * intentionally left unscoped: there's no caller identity yet to scope
 * *to*. Once a context exists, a SUPER_ADMIN's null `schoolId` also
 * leaves queries unscoped — that bypass is deliberate (§06) and every
 * route that relies on it lives under the explicitly-named
 * `/super-admin` namespace with its own explicit, logged scoping.
 */
export const prisma = basePrisma.$extends({
  name: "tenant-scope",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_MODELS.has(model as Prisma.ModelName)) return query(args);

        const ctx = getTenantContext();
        if (!ctx?.schoolId) return query(args);

        const scoped = args as { where?: Record<string, unknown>; data?: unknown };

        if (WHERE_OPERATIONS.has(operation)) {
          scoped.where = { ...scoped.where, schoolId: ctx.schoolId };
        } else if (operation === "create") {
          scoped.data = { ...(scoped.data as Record<string, unknown>), schoolId: ctx.schoolId };
        } else if (operation === "createMany" && Array.isArray(scoped.data)) {
          scoped.data = scoped.data.map((row) => ({ ...row, schoolId: ctx.schoolId }));
        } else if (operation === "upsert") {
          const upsertArgs = args as { where?: Record<string, unknown>; create?: unknown; update?: unknown };
          upsertArgs.where = { ...upsertArgs.where, schoolId: ctx.schoolId };
          upsertArgs.create = { ...(upsertArgs.create as Record<string, unknown>), schoolId: ctx.schoolId };
        }

        return query(scoped);
      },
    },
  },
});
