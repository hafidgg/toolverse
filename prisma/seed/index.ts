import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedContent } from "./content";

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

  console.log("Admin login: admin@toolverse.local / ChangeMe123! (change immediately)");

  const summary = await seedContent();
  console.log("\nSUMMARY");
  console.log(`Categories: ${summary.categories}`);
  console.log(`Subcategories: ${summary.subcategories}`);
  console.log(`Companies: ${summary.companies}`);
  console.log(`Tools: ${summary.tools.upserted} upserted, ${summary.tools.skipped.length} skipped`);
  if (summary.tools.skipped.length > 0) {
    console.log("Skipped tools:");
    for (const s of summary.tools.skipped) console.log(`  - ${s.slug} → ${s.reason}`);
  }
  console.log(`Collections: ${summary.collections}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });