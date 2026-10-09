// Creates the launch categories (docs/BLOG_ADMIN_SPEC.md §4.1).
// Safe to run again: existing categories are matched by slug and left untouched,
// so names, descriptions and order edited in the admin are never overwritten.
// Usage: npm run seed:categories
require("dotenv").config({ path: [".env.local", ".env"], quiet: true });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = [
  {
    name: "Telecommunications",
    slug: "telecommunications",
    description:
      "PSTN, E1, PRI, telephone exchanges, MDF, call routing and numbering systems.",
  },
  {
    name: "Networking",
    slug: "networking",
    description:
      "TCP/IP, routing, switching, VLANs, OSPF, DHCP, DNS, NAT and network troubleshooting.",
  },
  {
    name: "GPON & Fiber Optics",
    slug: "gpon-fiber-optics",
    description:
      "GPON architecture, OLT/ONT/ONU, splitters, optical power, link loss and SFP modules.",
  },
  {
    name: "VoIP & IP-PBX",
    slug: "voip-ip-pbx",
    description:
      "SIP, IP-PBX, extensions, SIP trunking, softphones and voice troubleshooting.",
  },
  {
    name: "MikroTik",
    slug: "mikrotik",
    description:
      "RouterOS configuration, firewall, NAT, bandwidth management and routing on MikroTik.",
  },
  {
    name: "IT & Technology",
    slug: "it-technology",
    description:
      "Linux, servers, hosting, cloud, security fundamentals and developer tools.",
  },
];

async function main() {
  let created = 0;

  for (const [index, category] of categories.entries()) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.category.create({
      data: { ...category, sortOrder: index + 1 },
    });
    created += 1;
  }

  console.log(
    `Categories: ${created} created, ${categories.length - created} already existed.`,
  );
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
