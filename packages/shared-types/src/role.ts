// Mirrors the `Role` enum in apps/api/prisma/schema.prisma. A const
// object + union (not a real `enum`) so this file stays erasable — the
// web app's tsconfig requires that, and the API is happy either way.
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  ACCOUNTANT: "ACCOUNTANT",
  STAFF: "STAFF",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES = Object.values(Role);
