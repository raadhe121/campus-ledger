import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

// Exercises Phase 06 (architecture §11) end to end against the real (dev)
// database: an Accountant building a fee structure, generating charges for
// an enrolled student, recording a payment (with the §08 Idempotency-Key
// convention actually enforced), and getting a receipt back — the "an
// accountant recording a payment and issuing a receipt" demo the phase
// promises — plus the Student/Parent read-only side, the one place School
// Admin's scope narrows below the Accountant's (Expenses), and tenant
// isolation on all of it.

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
    prisma.school.create({ data: { name: `Fees A ${suffix}`, slug: `fees-a-${suffix}`, contactEmail: "a@fees-test.dev" } }),
    prisma.school.create({ data: { name: `Fees B ${suffix}`, slug: `fees-b-${suffix}`, contactEmail: "b@fees-test.dev" } }),
  ]);
  schoolAId = schoolA.id;
  schoolBId = schoolB.id;

  adminAEmail = `admin-a-${suffix}@fees-test.dev`;
  adminBEmail = `admin-b-${suffix}@fees-test.dev`;

  await Promise.all([
    prisma.user.create({ data: { email: adminAEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolA.id, firstName: "Admin", lastName: "A" } }),
    prisma.user.create({ data: { email: adminBEmail, passwordHash, role: "SCHOOL_ADMIN", status: "ACTIVE", schoolId: schoolB.id, firstName: "Admin", lastName: "B" } }),
  ]);
});

afterAll(async () => {
  const schools = await prisma.school.findMany({ where: { slug: { startsWith: "fees-" } }, select: { id: true } });
  const ids = schools.map((s) => s.id);

  // Leaf-to-root, ahead of the cascading school delete — same reasoning as
  // school-admin-core.test.ts: several of these FKs are Restrict, so Postgres
  // cascading every table's own schoolId FK at once isn't safe to rely on.
  await prisma.receipt.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.idempotencyKey.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.studentFee.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.feeItem.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.feeStructure.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.expense.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.parentStudent.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.enrollment.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.section.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.class.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.academicYear.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { targetSchoolId: { in: ids } } });
  await prisma.school.deleteMany({ where: { id: { in: ids } } }); // cascades users + their profiles + refresh tokens
});

async function login(email: string, password: string) {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.accessToken as string;
}

describe("Accountant module: fees, payments, receipts, expenses (architecture §11 Phase 06)", () => {
  it(
    "generates student fees, records a payment idempotently and issues a receipt, and keeps Expenses Accountant-only past R",
    async () => {
    const tokenA = await login(adminAEmail, PASSWORD);
    const auth = (t: string) => `Bearer ${t}`;
    const api = request(app);

    // --- School Admin stands up an enrolled student and an Accountant ---
    const yearRes = await api.post("/api/v1/academic-years").set("Authorization", auth(tokenA)).send({ label: `2026-2027-${suffix}`, startDate: "2026-06-01", endDate: "2027-04-30" });
    const yearId = yearRes.body.data.id as string;
    await api.post(`/api/v1/academic-years/${yearId}/activate`).set("Authorization", auth(tokenA));

    const classRes = await api.post("/api/v1/classes").set("Authorization", auth(tokenA)).send({ academicYearId: yearId, name: "Grade 5", order: 5 });
    const classId = classRes.body.data.id as string;

    const sectionRes = await api.post("/api/v1/sections").set("Authorization", auth(tokenA)).send({ classId, name: "A" });
    const sectionId = sectionRes.body.data.id as string;

    const studentRes = await api
      .post("/api/v1/students")
      .set("Authorization", auth(tokenA))
      .send({ email: `student-${suffix}@fees-test.dev`, firstName: "Sam", lastName: "Student", admissionNo: `ADM-${suffix}` });
    const studentId = studentRes.body.data.user.id as string;
    const studentTempPassword = studentRes.body.data.tempPassword as string;

    await api.post("/api/v1/enrollments").set("Authorization", auth(tokenA)).send({ studentId, sectionId, academicYearId: yearId, rollNo: "1" });

    const parentRes = await api.post("/api/v1/parents").set("Authorization", auth(tokenA)).send({ email: `parent-${suffix}@fees-test.dev`, firstName: "Pat", lastName: "Parent" });
    const parentTempPassword = parentRes.body.data.tempPassword as string;
    await api.post(`/api/v1/parents/${parentRes.body.data.user.id}/children`).set("Authorization", auth(tokenA)).send({ studentId, relation: "MOTHER", isPrimaryGuardian: true });

    const accountantRes = await api
      .post("/api/v1/staff")
      .set("Authorization", auth(tokenA))
      .send({ email: `accountant-${suffix}@fees-test.dev`, firstName: "Ada", lastName: "Accountant", role: "ACCOUNTANT" });
    expect(accountantRes.status).toBe(201);
    const accountantTempPassword = accountantRes.body.data.tempPassword as string;
    const tokenAccountant = await login(accountantRes.body.data.user.email, accountantTempPassword);

    // --- Accountant builds the fee structure and charges the class ---
    const structureRes = await api
      .post("/api/v1/fee-structures")
      .set("Authorization", auth(tokenAccountant))
      .send({ academicYearId: yearId, classId, name: "Grade 5 Tuition", frequency: "QUARTERLY" });
    expect(structureRes.status).toBe(201);
    const feeStructureId = structureRes.body.data.id as string;

    const itemRes = await api
      .post(`/api/v1/fee-structures/${feeStructureId}/items`)
      .set("Authorization", auth(tokenAccountant))
      .send({ label: "Q1 Tuition", amount: 500, dueDate: "2026-01-01" }); // deliberately past — exercises isOverdue
    expect(itemRes.status).toBe(201);
    const feeItemId = itemRes.body.data.id as string;

    const generateRes = await api.post(`/api/v1/fee-structures/items/${feeItemId}/generate`).set("Authorization", auth(tokenAccountant));
    expect(generateRes.status).toBe(201);
    expect(generateRes.body.data).toEqual({ created: 1, alreadyAssigned: 0 });

    // Running it again is a no-op, not a duplicate charge.
    const regenerateRes = await api.post(`/api/v1/fee-structures/items/${feeItemId}/generate`).set("Authorization", auth(tokenAccountant));
    expect(regenerateRes.body.data).toEqual({ created: 0, alreadyAssigned: 1 });

    const listRes = await api.get(`/api/v1/student-fees?studentId=${studentId}`).set("Authorization", auth(tokenAccountant));
    expect(listRes.body.data).toHaveLength(1);
    const studentFee = listRes.body.data[0];
    expect(studentFee.amountDue).toBe(500);
    expect(studentFee.status).toBe("PENDING");
    expect(studentFee.isOverdue).toBe(true); // unpaid and past its dueDate
    const studentFeeId = studentFee.id as string;

    // A fee item already charged to a student can't be deleted out from under them.
    const deleteItemRes = await api.delete(`/api/v1/fee-structures/items/${feeItemId}`).set("Authorization", auth(tokenAccountant));
    expect(deleteItemRes.status).toBe(409);

    // --- Recording payments: idempotency, partial → paid, and overpay guard ---
    const payload1 = { studentFeeId, amount: 300, method: "CASH", reference: "till-1" };
    const pay1 = await api.post("/api/v1/payments").set("Authorization", auth(tokenAccountant)).set("Idempotency-Key", "pay-key-1").send(payload1);
    expect(pay1.status).toBe(201);
    expect(pay1.body.data.receipt.receiptNo).toMatch(/^RC-\d{4}-\d{6}$/);

    // The exact same key replays the cached response instead of recording a second payment.
    const pay1Retry = await api.post("/api/v1/payments").set("Authorization", auth(tokenAccountant)).set("Idempotency-Key", "pay-key-1").send(payload1);
    expect(pay1Retry.status).toBe(201);
    expect(pay1Retry.body.data.id).toBe(pay1.body.data.id);
    expect(pay1Retry.body.data.receipt.receiptNo).toBe(pay1.body.data.receipt.receiptNo);

    const noKeyRes = await api.post("/api/v1/payments").set("Authorization", auth(tokenAccountant)).send({ studentFeeId, amount: 50, method: "CASH" });
    expect(noKeyRes.status).toBe(400);

    const partialRes = await api.get(`/api/v1/student-fees/${studentFeeId}`).set("Authorization", auth(tokenAccountant));
    expect(partialRes.body.data.status).toBe("PARTIAL");
    expect(partialRes.body.data.amountPaid).toBe(300);

    const overpayRes = await api
      .post("/api/v1/payments")
      .set("Authorization", auth(tokenAccountant))
      .set("Idempotency-Key", "pay-key-overpay")
      .send({ studentFeeId, amount: 300, method: "CARD" }); // only 200 remains
    expect(overpayRes.status).toBe(400);

    const pay2 = await api
      .post("/api/v1/payments")
      .set("Authorization", auth(tokenAccountant))
      .set("Idempotency-Key", "pay-key-2")
      .send({ studentFeeId, amount: 200, method: "BANK_TRANSFER", reference: "txn-2" });
    expect(pay2.status).toBe(201);

    const paidRes = await api.get(`/api/v1/student-fees/${studentFeeId}`).set("Authorization", auth(tokenAccountant));
    expect(paidRes.body.data.status).toBe("PAID");
    expect(paidRes.body.data.amountPaid).toBe(500);
    expect(paidRes.body.data.isOverdue).toBe(false); // PAID overrides a past dueDate

    const paymentsListRes = await api.get(`/api/v1/payments?studentFeeId=${studentFeeId}`).set("Authorization", auth(tokenAccountant));
    expect(paymentsListRes.body.data).toHaveLength(2); // the retried key didn't add a third

    // --- Student and Parent self-service reads (§07: R (self) / R (children)) ---
    const tokenStudent = await login(studentRes.body.data.user.email, studentTempPassword);
    const myFeesRes = await api.get("/api/v1/me/fees").set("Authorization", auth(tokenStudent));
    expect(myFeesRes.status).toBe(200);
    expect(myFeesRes.body.data).toHaveLength(1);
    expect(myFeesRes.body.data[0].status).toBe("PAID");

    const tokenParent = await login(parentRes.body.data.user.email, parentTempPassword);
    const childFeesRes = await api.get(`/api/v1/me/children/${studentId}/fees`).set("Authorization", auth(tokenParent));
    expect(childFeesRes.status).toBe(200);
    expect(childFeesRes.body.data[0].id).toBe(studentFeeId);

    // A Student never reaches the Manage surface at all.
    const studentTriesManage = await api.get("/api/v1/student-fees").set("Authorization", auth(tokenStudent));
    expect(studentTriesManage.status).toBe(403);

    // --- Expenses: Accountant Manage, School Admin drops to R (§07's one narrowing in this phase) ---
    const expenseRes = await api.post("/api/v1/expenses").set("Authorization", auth(tokenAccountant)).send({ category: "Utilities", amount: 120.5, vendor: "City Power", date: "2026-06-15" });
    expect(expenseRes.status).toBe(201);

    const adminReadsExpenses = await api.get("/api/v1/expenses").set("Authorization", auth(tokenA));
    expect(adminReadsExpenses.status).toBe(200);
    expect(adminReadsExpenses.body.data).toHaveLength(1);

    const adminWritesExpense = await api.post("/api/v1/expenses").set("Authorization", auth(tokenA)).send({ category: "Supplies", amount: 10, date: "2026-06-16" });
    expect(adminWritesExpense.status).toBe(403);

    // --- Tenant isolation (§06): School B's Accountant gets 404, never 403, on any of School A's ids ---
    const accountantBRes = await api
      .post("/api/v1/staff")
      .set("Authorization", auth(await login(adminBEmail, PASSWORD)))
      .send({ email: `accountant-b-${suffix}@fees-test.dev`, firstName: "Bea", lastName: "Accountant", role: "ACCOUNTANT" });
    const tokenAccountantB = await login(accountantBRes.body.data.user.email, accountantBRes.body.data.tempPassword);

    const crossTenantChecks = await Promise.all([
      api.get(`/api/v1/fee-structures/${feeStructureId}`).set("Authorization", auth(tokenAccountantB)),
      api.get(`/api/v1/student-fees/${studentFeeId}`).set("Authorization", auth(tokenAccountantB)),
      api.get(`/api/v1/payments/${pay1.body.data.id}`).set("Authorization", auth(tokenAccountantB)),
    ]);
    for (const res of crossTenantChecks) expect(res.status).toBe(404);
    },
    60_000, // ~30 real HTTP round trips against Neon, several through bcrypt — comfortably past the file's default 20s
  );
});
