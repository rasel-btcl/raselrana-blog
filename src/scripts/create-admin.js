// scripts/create-admin.js
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "blog@raselrana.com"; // change this
  const plainPassword = "RANA_blog#26"; // change this
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: "Rasel Rana",
      email,
      passwordHash,
      role: "admin",
    },
  });

  console.log("Admin user ready:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
