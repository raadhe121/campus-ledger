import type { Role } from "./role.js";

export const UserStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** A user as the API ever returns it — never passwordHash, never a refresh token. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  schoolId: string | null;
  status: UserStatus;
  createdAt: string;
}
