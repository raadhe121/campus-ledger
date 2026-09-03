import type { User } from "@prisma/client";
import type { PublicUser } from "@campus-ledger/shared-types";

/** Never send passwordHash or tokenVersion to a client — this is the one seam that guarantees it. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
    role: user.role,
    schoolId: user.schoolId,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
