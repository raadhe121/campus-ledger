import { prisma } from "../../lib/prisma.js";
import { slugify, withSuffix } from "../../lib/slug.js";
import { hashPassword, generateTempPassword } from "../../lib/password.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { toPublicUser } from "../users/user.mapper.js";
import { parsePagination, paginationMeta, type PageParams } from "../../lib/pagination.js";
import { writeAuditLog } from "../../lib/audit.js";
import type {
  CreateSchoolInput,
  UpdateSchoolInput,
  SchoolStatusInput,
  CreateSchoolAdminInput,
} from "@campus-ledger/validation-schemas";
import type { School, SchoolStatus } from "@campus-ledger/shared-types";

function toPublicSchool(school: {
  id: string;
  name: string;
  slug: string;
  status: SchoolStatus;
  plan: string;
  contactEmail: string;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}): School {
  return { ...school, createdAt: school.createdAt.toISOString(), updatedAt: school.updatedAt.toISOString() };
}

async function uniqueSlugFor(name: string): Promise<string> {
  const base = slugify(name) || "school";
  const existing = await prisma.school.findUnique({ where: { slug: base } });
  return existing ? withSuffix(base) : base;
}

export async function createSchool(input: CreateSchoolInput, actorUserId: string): Promise<School> {
  const slug = await uniqueSlugFor(input.name);
  const school = await prisma.school.create({ data: { ...input, slug } });

  await writeAuditLog({ actorUserId, action: "school.create", targetSchoolId: school.id, entity: "School", entityId: school.id });

  return toPublicSchool(school);
}

export async function listSchools(query: Record<string, unknown>) {
  const page = parsePagination(query);
  const status = typeof query.status === "string" ? (query.status as SchoolStatus) : undefined;

  const [rows, total] = await Promise.all([
    prisma.school.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.limit,
    }),
    prisma.school.count({ where: status ? { status } : undefined }),
  ]);

  return { schools: rows.map(toPublicSchool), meta: paginationMeta(total, page) };
}

async function findSchoolOrThrow(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new NotFoundError("School not found");
  return school;
}

export async function getSchool(schoolId: string): Promise<School> {
  return toPublicSchool(await findSchoolOrThrow(schoolId));
}

export async function updateSchool(schoolId: string, input: UpdateSchoolInput, actorUserId: string): Promise<School> {
  await findSchoolOrThrow(schoolId);
  const school = await prisma.school.update({ where: { id: schoolId }, data: input });

  await writeAuditLog({ actorUserId, action: "school.update", targetSchoolId: schoolId, entity: "School", entityId: schoolId, diff: input });

  return toPublicSchool(school);
}

export async function setSchoolStatus(schoolId: string, input: SchoolStatusInput, actorUserId: string): Promise<School> {
  await findSchoolOrThrow(schoolId);
  const school = await prisma.school.update({ where: { id: schoolId }, data: { status: input.status } });

  await writeAuditLog({
    actorUserId,
    action: "school.status_change",
    targetSchoolId: schoolId,
    entity: "School",
    entityId: schoolId,
    diff: { status: input.status },
  });

  return toPublicSchool(school);
}

export async function createSchoolAdmin(schoolId: string, input: CreateSchoolAdminInput, actorUserId: string) {
  await findSchoolOrThrow(schoolId);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with this email already exists");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: { ...input, schoolId, role: "SCHOOL_ADMIN", status: "ACTIVE", passwordHash },
  });

  await writeAuditLog({
    actorUserId,
    action: "school_admin.create",
    targetSchoolId: schoolId,
    entity: "User",
    entityId: user.id,
  });

  // The one time this plaintext value exists outside the hash — shown
  // once in the response, never logged, never stored. Swapped for a
  // real emailed invite once a mail provider lands (blueprint §12).
  return { user: toPublicUser(user), tempPassword };
}

export async function listSchoolAdmins(schoolId: string, query: Record<string, unknown>) {
  await findSchoolOrThrow(schoolId);
  const page: PageParams = parsePagination(query);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId, role: "SCHOOL_ADMIN" },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.limit,
    }),
    prisma.user.count({ where: { schoolId, role: "SCHOOL_ADMIN" } }),
  ]);

  return { admins: rows.map(toPublicUser), meta: paginationMeta(total, page) };
}
