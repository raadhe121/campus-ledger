// Creates the platform's one SUPER_ADMIN. There is deliberately no API
// route that does this — the hierarchy in the architecture doc starts
// at Super Admin, so the first one has to come from somewhere outside
// the hierarchy itself. Safe to re-run: it upserts by email and leaves
// an existing account's password alone.
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateTempPassword } from "../src/lib/password.js";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function main() {
  const email = env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@campusledger.dev";
  const name = env.SEED_SUPER_ADMIN_NAME ?? "Platform Super Admin";
  const [firstName, ...rest] = name.split(" ");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super Admin already exists: ${email} (id ${existing.id}) — nothing to do.`);
    return;
  }

  const password = env.SEED_SUPER_ADMIN_PASSWORD ?? generateTempPassword();
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      schoolId: null,
      firstName: firstName ?? "Super",
      lastName: rest.join(" ") || "Admin",
    },
  });

  console.log("Created Super Admin:");
  console.log(`  id:       ${user.id}`);
  console.log(`  email:    ${email}`);
  if (!env.SEED_SUPER_ADMIN_PASSWORD) {
    console.log(`  password: ${password}  (generated — save this, it will not be shown again)`);
  } else {
    console.log("  password: (from SEED_SUPER_ADMIN_PASSWORD)");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
