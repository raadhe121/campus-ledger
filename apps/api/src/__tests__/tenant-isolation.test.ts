import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

// Exercises architecture §06 end to end against the real (dev) database:
// two schools, two School Admins, and the specific attack the blueprint
// calls out — a School A user reaching School B's data by guessing an
// id, not just by clicking around their own UI.

const app = createApp();
const PASSWORD = "Test-Password-1234!";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let schoolAId: string;
let adminAEmail: string;
let adminBId: string;
let adminBEmail: string;

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD);

  const [schoolA, schoolB] = await Promise.all([
    prisma.school.create({ data: { name: `Isolation A ${suffix}`, slug: `isolation-a-${suffix}`, contactEmail: "a@isolation-test.dev" } }),
    prisma.school.create({ data: { name: `Isolation B ${suffix}`, slug: `isolation-b-${suffix}`, contactEmail: "b@isolation-test.dev" } }),
  ]);
  schoolAId = schoolA.id;

  adminAEmail = `admin-a-${suffix}@isolation-test.dev`;
  adminBEmail = `admin-b-${suffix}@isolation-test.dev`;

  const [adminA, adminB] = await Promise.all([
    prisma.user.create({
      data: { email: adminAEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolA.id, firstName: "Admin", lastName: "A" },
    }),
    prisma.user.create({
      data: { email: adminBEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolB.id, firstName: "Admin", lastName: "B" },
    }),
  ]);
  adminBId = adminB.id;
  void adminA;
});

afterAll(async () => {
  const schools = await prisma.school.findMany({ where: { slug: { startsWith: "isolation-" } }, select: { id: true } });
  const ids = schools.map((s) => s.id);
  await prisma.auditLog.deleteMany({ where: { targetSchoolId: { in: ids } } });
  await prisma.school.deleteMany({ where: { id: { in: ids } } }); // cascades to users + refresh tokens
});

async function loginAs(email: string) {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.accessToken as string;
}

describe("tenant isolation (architecture §06)", () => {
  it("blocks a School A admin from reading a School B admin by id — 404, not 403", async () => {
    const tokenA = await loginAs(adminAEmail);

    const res = await request(app).get(`/api/v1/users/${adminBId}`).set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it("scopes the user list to the caller's own school, nothing else", async () => {
    const tokenA = await loginAs(adminAEmail);

    const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].schoolId).toBe(schoolAId);
  });

  it("blocks a School Admin from Super Admin-only routes — RBAC layer, separate from tenant scoping", async () => {
    const tokenA = await loginAs(adminAEmail);

    const res = await request(app).get("/api/v1/super-admin/schools").set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated request outright", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });
});

describe("auth (architecture §05)", () => {
  it("gives one generic message for both a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app).post("/api/v1/auth/login").send({ email: adminAEmail, password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@isolation-test.dev", password: "wrong-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it("revokes the whole refresh-token family when a retired token is replayed", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: adminAEmail, password: PASSWORD });
    const originalCookie = loginRes.headers["set-cookie"] as string[] | undefined;
    expect(originalCookie).toBeDefined();

    const firstRefresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", originalCookie!);
    expect(firstRefresh.status).toBe(200);
    const rotatedCookie = firstRefresh.headers["set-cookie"] as string[] | undefined;
    expect(rotatedCookie).toBeDefined();

    const replay = await request(app).post("/api/v1/auth/refresh").set("Cookie", originalCookie!);
    expect(replay.status).toBe(401);

    const afterReuse = await request(app).post("/api/v1/auth/refresh").set("Cookie", rotatedCookie!);
    expect(afterReuse.status).toBe(401);
  });
});
