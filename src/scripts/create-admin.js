// Creates or updates the admin user.
// Usage: set ADMIN_EMAIL, ADMIN_PASSWORD (and optionally ADMIN_NAME, ADMIN_USERNAME)
// in .env.local, then run `node src/scripts/create-admin.js`.
require("dotenv").config({ path: [".env.local", ".env"], quiet: true });

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const MIN_PASSWORD_LENGTH = 12;

const prisma = new PrismaClient();

function toUsername(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const username = toUsername(
    process.env.ADMIN_USERNAME?.trim() || name.replace(/\s+/g, ""),
  );

  if (!email || !plainPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first.");
  }
  if (plainPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }
  if (!username) {
    throw new Error("Set ADMIN_USERNAME (letters, numbers and hyphens).");
  }

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  // An existing account keeps its username (it is part of the author page address).
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role: "ADMIN", isActive: true },
    create: { name, username, email, passwordHash, role: "ADMIN" },
  });

  console.log("Admin user ready:", user.email, `(@${user.username})`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
