import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { toPublicUser } from "./user.mapper.js";
import { parsePagination, paginationMeta } from "../../lib/pagination.js";

/**
 * Neither of these two functions mentions `schoolId` anywhere — that's
 * the point. The Prisma extension in lib/prisma.ts injects it from the
 * caller's own tenant context on every query here, which is exactly
 * what makes this module the right place to prove isolation actually
 * holds (see the tenant-isolation test suite).
 */

export async function listUsersInMySchool(query: Record<string, unknown>) {
  const page = parsePagination(query);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, skip: page.skip, take: page.limit }),
    prisma.user.count(),
  ]);

  return { users: rows.map(toPublicUser), meta: paginationMeta(total, page) };
}

export async function getUserInMySchool(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // A user that exists but belongs to another school looks identical,
  // from here, to one that doesn't exist at all — 404, never 403, so
  // the response itself never confirms another school's data exists.
  if (!user) throw new NotFoundError("User not found");
  return toPublicUser(user);
}
