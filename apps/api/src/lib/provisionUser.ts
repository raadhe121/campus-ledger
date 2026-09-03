import { prisma } from "./prisma.js";
import { hashPassword, generateTempPassword } from "./password.js";
import { ConflictError } from "./errors.js";
import type { Role } from "@campus-ledger/shared-types";
import type { User } from "@prisma/client";

export interface ProvisionUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Creates the User row for a Teacher/Student/Parent/Staff a School Admin is
 * adding — the same one-time-temp-password shape as Super Admin's
 * createSchoolAdmin (schools.service.ts), reused here so every "add a
 * person" flow behaves identically regardless of role. `schoolId` is never
 * passed: the tenant-scoping Prisma extension (lib/prisma.ts) stamps it
 * from the caller's own tenant context on the `create`, so a School Admin
 * can only ever provision people into their own school.
 */
export async function provisionSchoolUser(role: Role, input: ProvisionUserInput): Promise<{ user: User; tempPassword: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with this email already exists");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: { ...input, role, status: "ACTIVE", passwordHash },
  });

  return { user, tempPassword };
}
