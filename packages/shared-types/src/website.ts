/** A stat counter — "2,500 Students", "98% Board Success". */
export interface WebsiteStat {
  title: string;
  value: string;
}

/** One entry in the achievements grid or the programs/stages cards — both share this shape. */
export interface WebsiteHighlight {
  title: string;
  description?: string;
}

/** One campus/branch listing, for schools with more than one location. */
export interface WebsiteCampus {
  name: string;
  address: string;
}

export interface SchoolWebsite {
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
  stats: WebsiteStat[];
  highlights: WebsiteHighlight[];
  programs: WebsiteHighlight[];
  campuses: WebsiteCampus[];
  themeColor: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What `GET /api/v1/school-website` (the School Admin editor) returns — the editable row plus the school's own name/slug, since that's what a School Admin actually needs to know to point their own apps/school-site deployment at this content. */
export interface SchoolWebsiteWithSchool extends SchoolWebsite {
  school: { name: string; slug: string };
}

export interface SchoolAnnouncement {
  id: string;
  schoolId: string;
  websiteId: string;
  title: string;
  body: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** What the public, unauthenticated `GET /api/v1/public/schools/:slug` endpoint returns — deliberately its own shape, not `SchoolWebsite` itself, so a field added there for internal/editing use (e.g. an id) never leaks to an anonymous caller by accident. */
export interface PublicSchoolSite {
  school: { name: string; slug: string };
  website: {
    tagline: string | null;
    heroImageUrl: string | null;
    aboutText: string | null;
    admissionsText: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    philosophyText: string | null;
    philosophyImageUrl: string | null;
    stats: WebsiteStat[];
    highlights: WebsiteHighlight[];
    programs: WebsiteHighlight[];
    campuses: WebsiteCampus[];
    themeColor: string;
  };
  announcements: { id: string; title: string; body: string; publishedAt: string }[];
}
