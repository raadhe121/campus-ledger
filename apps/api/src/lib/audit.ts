import { prisma } from "./prisma.js";

/**
 * Every school-scoped write worth a trail lands here — not just the
 * cross-tenant Super Admin actions §06 calls out, but School Admin's own
 * writes too, so "who changed this" is answerable regardless of who asked.
 * Deliberately writes through `basePrisma`-equivalent semantics: AuditLog
 * itself was never added to TENANT_MODELS (§03 lists it as global), so this
 * insert is never accidentally scoped by the tenant-context extension.
 */
export async function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  targetSchoolId: string;
  entity: string;
  entityId?: string;
  diff?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      targetSchoolId: params.targetSchoolId,
      entity: params.entity,
      entityId: params.entityId,
      diff: params.diff as never,
    },
  });
}
