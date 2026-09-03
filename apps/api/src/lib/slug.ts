import crypto from "node:crypto";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends a short random suffix — called only when the plain slug already collides. */
export function withSuffix(slug: string): string {
  return `${slug}-${crypto.randomBytes(3).toString("hex")}`;
}
