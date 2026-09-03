import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

// Exercises Phase 02 (architecture §11) end to end against the real (dev)
// database: one School Admin standing up an academic year, a class, a
// section with a class teacher, a subject, a student, and a parent linked
// to that student — the "fully staffed, fully enrolled school" demo the
// phase promises — plus the two isolation/ownership checks that matter
// most: a second school's admin can't read any of it, and a class teacher
// has to actually be a teacher.

const app = createApp();
const PASSWORD = "Test-Password-1234!";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let schoolAId: string;
let schoolBId: string;
let adminAEmail: string;
let adminBEmail: string;

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD);

  const [schoolA, schoolB] = await Promise.all([
    prisma.school.create({ data: { name: `Core Setup A ${suffix}`, slug: `core-setup-a-${suffix}`, contactEmail: "a@core-setup-test.dev" } }),
    prisma.school.create({ data: { name: `Core Setup B ${suffix}`, slug: `core-setup-b-${suffix}`, contactEmail: "b@core-setup-test.dev" } }),
  ]);
  schoolAId = schoolA.id;
  schoolBId = schoolB.id;

  adminAEmail = `admin-a-${suffix}@core-setup-test.dev`;
  adminBEmail = `admin-b-${suffix}@core-setup-test.dev`;

  await Promise.all([
    prisma.user.create({
      data: { email: adminAEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolA.id, firstName: "Admin", lastName: "A" },
    }),
    prisma.user.create({
      data: { email: adminBEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolB.id, firstName: "Admin", lastName: "B" },
    }),
  ]);
});

afterAll(async () => {
  const schools = await prisma.school.findMany({ where: { slug: { startsWith: "core-setup-" } }, select: { id: true } });
  const ids = schools.map((s) => s.id);

  // Deleted leaf-to-root, ahead of the cascading school delete — several of
  // these FKs are Restrict (§03's closing note on this file), so letting
  // Postgres's cascade graph sort out the order isn't safe to rely on.
  await prisma.parentStudent.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.enrollment.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.section.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.class.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.academicYear.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.subject.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { targetSchoolId: { in: ids } } });
  await prisma.school.deleteMany({ where: { id: { in: ids } } }); // cascades users + their profiles + refresh tokens
});

async function loginAs(email: string) {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.accessToken as string;
}

describe("School Admin core setup (architecture §11 Phase 02)", () => {
  it(
    "stands up a fully staffed, fully enrolled school and keeps it isolated from another school's admin",
    async () => {
    const tokenA = await loginAs(adminAEmail);
    const auth = (t: string) => `Bearer ${t}`;
    const api = request(app);

    const yearRes = await api
      .post("/api/v1/academic-years")
      .set("Authorization", auth(tokenA))
      .send({ label: `2026-2027-${suffix}`, startDate: "2026-06-01", endDate: "2027-04-30" });
    expect(yearRes.status).toBe(201);
    const yearId = yearRes.body.data.id as string;

    const activateRes = await api.post(`/api/v1/academic-years/${yearId}/activate`).set("Authorization", auth(tokenA));
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.isActive).toBe(true);

    const classRes = await api
      .post("/api/v1/classes")
      .set("Authorization", auth(tokenA))
      .send({ academicYearId: yearId, name: "Grade 5", order: 5 });
    expect(classRes.status).toBe(201);
    const classId = classRes.body.data.id as string;

    const teacherRes = await api
      .post("/api/v1/teachers")
      .set("Authorization", auth(tokenA))
      .send({ email: `teacher-${suffix}@core-setup-test.dev`, firstName: "Tess", lastName: "Teacher" });
    expect(teacherRes.status).toBe(201);
    expect(teacherRes.body.data.tempPassword).toBeTruthy();
    const teacherId = teacherRes.body.data.user.id as string;

    // A nonexistent/non-teacher id can't be a class teacher — ownership, not just role membership (§07).
    const badSectionRes = await api
      .post("/api/v1/sections")
      .set("Authorization", auth(tokenA))
      .send({ classId, name: "A", classTeacherId: `not-a-teacher-${suffix}` });
    expect(badSectionRes.status).toBe(400);

    const sectionRes = await api
      .post("/api/v1/sections")
      .set("Authorization", auth(tokenA))
      .send({ classId, name: "A", classTeacherId: teacherId });
    expect(sectionRes.status).toBe(201);
    const sectionId = sectionRes.body.data.id as string;

    const subjectRes = await api
      .post("/api/v1/subjects")
      .set("Authorization", auth(tokenA))
      .send({ name: "Mathematics", code: `MATH-${suffix}` });
    expect(subjectRes.status).toBe(201);

    const studentRes = await api
      .post("/api/v1/students")
      .set("Authorization", auth(tokenA))
      .send({ email: `student-${suffix}@core-setup-test.dev`, firstName: "Sam", lastName: "Student", admissionNo: `ADM-${suffix}` });
    expect(studentRes.status).toBe(201);
    const studentId = studentRes.body.data.user.id as string;

    const enrollRes = await api
      .post("/api/v1/enrollments")
      .set("Authorization", auth(tokenA))
      .send({ studentId, sectionId, academicYearId: yearId, rollNo: "1" });
    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.data.section.className).toBe("Grade 5");

    // Enrolling the same student for the same year twice is a conflict, not a second row.
    const dupEnrollRes = await api
      .post("/api/v1/enrollments")
      .set("Authorization", auth(tokenA))
      .send({ studentId, sectionId, academicYearId: yearId, rollNo: "2" });
    expect(dupEnrollRes.status).toBe(409);

    const parentRes = await api
      .post("/api/v1/parents")
      .set("Authorization", auth(tokenA))
      .send({ email: `parent-${suffix}@core-setup-test.dev`, firstName: "Pat", lastName: "Parent" });
    expect(parentRes.status).toBe(201);
    const parentId = parentRes.body.data.user.id as string;

    const linkRes = await api
      .post(`/api/v1/parents/${parentId}/children`)
      .set("Authorization", auth(tokenA))
      .send({ studentId, relation: "MOTHER", isPrimaryGuardian: true });
    expect(linkRes.status).toBe(201);

    const childrenRes = await api.get(`/api/v1/parents/${parentId}/children`).set("Authorization", auth(tokenA));
    expect(childrenRes.status).toBe(200);
    expect(childrenRes.body.data).toHaveLength(1);
    expect(childrenRes.body.data[0].student.id).toBe(studentId);

    // Everything above belongs to School A — School B's admin gets 404 on every one of these ids, never 403 (§06).
    const tokenB = await loginAs(adminBEmail);
    const crossTenantChecks = await Promise.all([
      api.get(`/api/v1/academic-years/${yearId}`).set("Authorization", auth(tokenB)),
      api.get(`/api/v1/classes/${classId}`).set("Authorization", auth(tokenB)),
      api.get(`/api/v1/sections/${sectionId}`).set("Authorization", auth(tokenB)),
      api.get(`/api/v1/teachers/${teacherId}`).set("Authorization", auth(tokenB)),
      api.get(`/api/v1/students/${studentId}`).set("Authorization", auth(tokenB)),
      api.get(`/api/v1/parents/${parentId}`).set("Authorization", auth(tokenB)),
    ]);
    for (const res of crossTenantChecks) expect(res.status).toBe(404);
    },
    60_000, // ~20 real HTTP round trips against Neon, several through bcrypt — comfortably past the file's default 20s
  );
});
