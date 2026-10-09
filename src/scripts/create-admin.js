// Creates or updates the admin user.
// Usage: set ADMIN_EMAIL, ADMIN_PASSWORD (and optionally ADMIN_NAME) in .env.local,
// then run `node src/scripts/create-admin.js`.
require("dotenv").config({ path: [".env.local", ".env"], quiet: true });

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const MIN_PASSWORD_LENGTH = 12;

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !plainPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first.");
  }
  if (plainPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { name, email, passwordHash, role: "admin" },
  });

  console.log("Admin user ready:", user.email);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
