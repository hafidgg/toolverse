/**
 * Reports on the actual database state after seeding — verification
 * coverage, SEO completeness, and any dangling/missing relations. Distinct
 * from validate-content.ts, which checks the JSON source files before they
 * ever touch the database.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [
    categoryCount,
    companyCount,
    toolCount,
    publishedCount,
    sourceCheckedCount,
    unverifiedCount,
    editorReviewedCount,
    toolsMissingSeo,
    toolsMissingCompany,
    toolsMissingPlatforms,
    collectionCount,
    tagCount,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.company.count(),
    prisma.tool.count(),
    prisma.tool.count({ where: { status: "PUBLISHED" } }),
    prisma.tool.count({ where: { verificationStatus: "SOURCE_CHECKED" } }),
    prisma.tool.count({ where: { verificationStatus: "UNVERIFIED" } }),
    prisma.tool.count({ where: { verificationStatus: "EDITOR_REVIEWED" } }),
    prisma.tool.count({ where: { OR: [{ seoId: null }, { seo: { metaDescription: null } }] } }),
    prisma.tool.count({ where: { companyId: null } }),
    prisma.tool.count({ where: { platforms: { none: {} } } }),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);

  // Duplicate slug/name detection at the DB level (should be impossible
  // given unique constraints, but checked explicitly for the report).
  const duplicateSlugCheck = await prisma.tool.groupBy({
    by: ["slug"],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });

  console.log("\nCONTENT AUDIT\n");
  console.log(`Categories:\n${categoryCount}\n`);
  console.log(`Companies:\n${companyCount}\n`);
  console.log(`Tools:\n${toolCount}\n`);
  console.log(`Published:\n${publishedCount}\n`);
  console.log(`Source checked:\n${sourceCheckedCount}\n`);
  console.log(`Unverified:\n${unverifiedCount}\n`);
  console.log(`Editor reviewed:\n${editorReviewedCount}\n`);
  console.log(`Missing SEO description:\n${toolsMissingSeo}\n`);
  console.log(`Missing company:\n${toolsMissingCompany}\n`);
  console.log(`Missing platform:\n${toolsMissingPlatforms}\n`);
  console.log(`Duplicate slugs:\n${duplicateSlugCheck.length}\n`);
  console.log(`Collections:\n${collectionCount}\n`);
  console.log(`Tags:\n${tagCount}\n`);

  if (unverifiedCount > 0) {
    console.log(
      `⚠ ${unverifiedCount} tool(s) are UNVERIFIED — their identity/website is believed accurate ` +
        `based on well-established knowledge, but pricing/feature specifics have not been checked ` +
        `against a live source this session. Recommended before wide publication: spot-check each ` +
        `against its official website, especially pricing and platform support, which change often.\n`
    );
  }
  if (editorReviewedCount > 0) {
    console.log(
      `Note: ${editorReviewedCount} tool(s) are marked EDITOR_REVIEWED. This status should only be ` +
        `set after an actual human editorial review has taken place.\n`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
