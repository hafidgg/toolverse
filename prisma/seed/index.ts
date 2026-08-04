import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.admin.upsert({
    where: { email: "admin@toolverse.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@toolverse.local",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.settings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      siteName: "ToolVerse",
      siteDescription: "Discover the best digital tools and online resources.",
      siteUrl: "https://toolverse.example.com",
    },
  });

  const platforms = ["Web", "iOS", "Android", "Windows", "macOS", "Linux", "API"];
  for (const name of platforms) {
    await prisma.platform.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  const category = await prisma.category.upsert({
    where: { slug: "ai-tools" },
    update: {},
    create: {
      name: "AI Tools",
      slug: "ai-tools",
      description: "Artificial intelligence powered tools and platforms.",
      isFeatured: true,
    },
  });

  console.log("Seed complete. Category:", category.slug);
  console.log("Admin login: admin@toolverse.local / ChangeMe123! (change immediately)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
