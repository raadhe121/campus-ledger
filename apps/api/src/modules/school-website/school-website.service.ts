import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import type { UpdateSchoolWebsiteInput, CreateAnnouncementInput, UpdateAnnouncementInput } from "@campus-ledger/validation-schemas";
import type { SchoolWebsite, SchoolWebsiteWithSchool, SchoolAnnouncement, PublicSchoolSite, WebsiteStat, WebsiteHighlight, WebsiteCampus } from "@campus-ledger/shared-types";

/** The four list fields are stored as plain `Json` — validation-schemas is what actually enforces their shape on the way in, so this is just "null becomes an empty list", not a real runtime shape check. */
function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toWebsite(row: {
  id: string;
  schoolId: string;
  tagline: string | null;
  heroImageUrl: string | null;
  aboutText: string | null;
  admissionsText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  philosophyText: string | null;
  philosophyImageUrl: string | null;
  stats: unknown;
  highlights: unknown;
  programs: unknown;
  campuses: unknown;
  themeColor: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SchoolWebsite {
  return {
    id: row.id,
    schoolId: row.schoolId,
    tagline: row.tagline,
    heroImageUrl: row.heroImageUrl,
    aboutText: row.aboutText,
    admissionsText: row.admissionsText,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    address: row.address,
    philosophyText: row.philosophyText,
    philosophyImageUrl: row.philosophyImageUrl,
    stats: asArray<WebsiteStat>(row.stats),
    highlights: asArray<WebsiteHighlight>(row.highlights),
    programs: asArray<WebsiteHighlight>(row.programs),
    campuses: asArray<WebsiteCampus>(row.campuses),
    themeColor: row.themeColor,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAnnouncement(row: { id: string; schoolId: string; websiteId: string; title: string; body: string; publishedAt: Date; createdAt: Date; updatedAt: Date }): SchoolAnnouncement {
  return { ...row, publishedAt: row.publishedAt.toISOString(), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

/** Doesn't exist until a School Admin first touches it — every management call below goes through here rather than assuming the row is there. */
async function getOrCreateWebsite(schoolId: string) {
  const existing = await prisma.schoolWebsite.findUnique({ where: { schoolId } });
  if (existing) return existing;
  return prisma.schoolWebsite.create({ data: { schoolId } });
}

export async function getMyWebsite(schoolId: string): Promise<SchoolWebsiteWithSchool> {
  const [website, school] = await Promise.all([getOrCreateWebsite(schoolId), prisma.school.findUniqueOrThrow({ where: { id: schoolId } })]);
  return { ...toWebsite(website), school: { name: school.name, slug: school.slug } };
}

export async function updateMyWebsite(input: UpdateSchoolWebsiteInput, actorUserId: string, schoolId: string): Promise<SchoolWebsite> {
  await getOrCreateWebsite(schoolId);
  const updated = await prisma.schoolWebsite.update({ where: { schoolId }, data: input });

  await writeAuditLog({ actorUserId, action: "school_website.update", targetSchoolId: schoolId, entity: "SchoolWebsite", entityId: updated.id, diff: input });

  return toWebsite(updated);
}

export async function setPublished(published: boolean, actorUserId: string, schoolId: string): Promise<SchoolWebsite> {
  await getOrCreateWebsite(schoolId);
  const updated = await prisma.schoolWebsite.update({ where: { schoolId }, data: { isPublished: published } });

  await writeAuditLog({ actorUserId, action: published ? "school_website.publish" : "school_website.unpublish", targetSchoolId: schoolId, entity: "SchoolWebsite", entityId: updated.id });

  return toWebsite(updated);
}

export async function listMyAnnouncements(): Promise<SchoolAnnouncement[]> {
  const rows = await prisma.schoolAnnouncement.findMany({ orderBy: { publishedAt: "desc" } });
  return rows.map(toAnnouncement);
}

export async function createAnnouncement(input: CreateAnnouncementInput, actorUserId: string, schoolId: string): Promise<SchoolAnnouncement> {
  const website = await getOrCreateWebsite(schoolId);
  const created = await prisma.schoolAnnouncement.create({ data: { ...input, schoolId, websiteId: website.id } });

  await writeAuditLog({ actorUserId, action: "school_website.announcement.create", targetSchoolId: schoolId, entity: "SchoolAnnouncement", entityId: created.id });

  return toAnnouncement(created);
}

async function findAnnouncementOrThrow(announcementId: string) {
  const row = await prisma.schoolAnnouncement.findUnique({ where: { id: announcementId } });
  if (!row) throw new NotFoundError("Announcement not found");
  return row;
}

export async function updateAnnouncement(announcementId: string, input: UpdateAnnouncementInput, actorUserId: string, schoolId: string): Promise<SchoolAnnouncement> {
  await findAnnouncementOrThrow(announcementId);
  const updated = await prisma.schoolAnnouncement.update({ where: { id: announcementId }, data: input });

  await writeAuditLog({ actorUserId, action: "school_website.announcement.update", targetSchoolId: schoolId, entity: "SchoolAnnouncement", entityId: announcementId, diff: input });

  return toAnnouncement(updated);
}

export async function deleteAnnouncement(announcementId: string, actorUserId: string, schoolId: string): Promise<void> {
  await findAnnouncementOrThrow(announcementId);
  await prisma.schoolAnnouncement.delete({ where: { id: announcementId } });

  await writeAuditLog({ actorUserId, action: "school_website.announcement.delete", targetSchoolId: schoolId, entity: "SchoolAnnouncement", entityId: announcementId });
}

// ---------------------------------------------------------------------------
// Public, unauthenticated read — no tenant context exists for this request
// (the route this backs never runs authenticate/tenantContext, see
// public-site.routes.ts), so lib/prisma.ts's tenant-scoping extension is a
// no-op here the same way it is for Super Admin's cross-tenant routes:
// every query below filters by school id explicitly, never by relying on
// scoping that isn't there.
// ---------------------------------------------------------------------------

export async function getPublicSite(slug: string): Promise<PublicSchoolSite> {
  const school = await prisma.school.findUnique({ where: { slug } });
  if (!school || school.status !== "ACTIVE") throw new NotFoundError("School not found");

  const website = await prisma.schoolWebsite.findUnique({ where: { schoolId: school.id } });
  if (!website || !website.isPublished) throw new NotFoundError("This school hasn't published a website yet");

  const announcements = await prisma.schoolAnnouncement.findMany({ where: { schoolId: school.id }, orderBy: { publishedAt: "desc" }, take: 20 });

  const w = toWebsite(website);

  return {
    school: { name: school.name, slug: school.slug },
    website: {
      tagline: w.tagline,
      heroImageUrl: w.heroImageUrl,
      aboutText: w.aboutText,
      admissionsText: w.admissionsText,
      contactEmail: w.contactEmail,
      contactPhone: w.contactPhone,
      address: w.address,
      philosophyText: w.philosophyText,
      philosophyImageUrl: w.philosophyImageUrl,
      stats: w.stats,
      highlights: w.highlights,
      programs: w.programs,
      campuses: w.campuses,
      themeColor: w.themeColor,
    },
    announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, publishedAt: a.publishedAt.toISOString() })),
  };
}
