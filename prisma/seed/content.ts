import { PrismaClient, type PricingModel, type VerificationStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, "..", "..", "data");

function readJson<T>(relativePath: string): T {
  const filePath = path.join(DATA_DIR, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  order: number;
  isFeatured: boolean;
  isActive: boolean;
}

interface SubcategoryData {
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
}

interface TagData {
  name: string;
  slug: string;
}

interface PlatformData {
  name: string;
  slug: string;
}

interface IntegrationData {
  name: string;
  slug: string;
}

interface CompanyData {
  name: string;
  slug: string;
  websiteUrl: string;
  country?: string;
  foundedYear?: number;
  description: string;
}

interface ToolData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  pricingModel: PricingModel;
  startingPrice: number | null;
  currency: string | null;
  categorySlug: string;
  subcategorySlug: string | null;
  companySlug: string | null;
  platformSlugs: string[]; // platform *names*, matching data/taxonomy/platforms.json
  integrationSlugs: string[]; // integration *names*, matching integrations.json
  tagSlugs: string[]; // tag *names*, matching tags.json
  features: string[];
  pros: string[];
  cons: string[];
  faqs: { q: string; a: string }[];
  isFeatured: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  verificationStatus: VerificationStatus;
  sourceUrl: string | null;
  sourceType: string | null;
}

interface CollectionData {
  title: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  toolSlugs: string[];
}

/** Truncates text to a max length on a word boundary, for SEO meta fields. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max - 1)}…`;
}

async function upsertTaxonomy() {
  const platforms = readJson<PlatformData[]>("taxonomy/platforms.json");
  for (const p of platforms) {
    await prisma.platform.upsert({ where: { name: p.name }, update: {}, create: p });
  }

  const integrations = readJson<IntegrationData[]>("taxonomy/integrations.json");
  for (const i of integrations) {
    await prisma.integration.upsert({ where: { name: i.name }, update: {}, create: i });
  }

  const categories = readJson<CategoryData[]>("taxonomy/categories.json");
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        order: c.order,
        isFeatured: c.isFeatured,
        isActive: c.isActive,
      },
      create: c,
    });
  }

  const subcategories = readJson<SubcategoryData[]>("taxonomy/subcategories.json");
  for (const s of subcategories) {
    const category = await prisma.category.findUnique({ where: { slug: s.categorySlug } });
    if (!category) {
      console.warn(`  ⚠ Skipping subcategory "${s.slug}": category "${s.categorySlug}" not found`);
      continue;
    }
    await prisma.subcategory.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, categoryId: category.id },
      create: { name: s.name, slug: s.slug, description: s.description, categoryId: category.id },
    });
  }

  const tags = readJson<TagData[]>("taxonomy/tags.json");
  for (const t of tags) {
    await prisma.tag.upsert({ where: { slug: t.slug }, update: { name: t.name }, create: t });
  }

  console.log(
    `  Taxonomy: ${platforms.length} platforms, ${integrations.length} integrations, ${categories.length} categories, ${subcategories.length} subcategories, ${tags.length} tags`
  );
}

async function upsertCompanies() {
  const companies = readJson<CompanyData[]>("companies/companies.json");

  for (const c of companies) {
    const existing = await prisma.company.findUnique({ where: { slug: c.slug } });

    const seoData = {
      metaTitle: truncate(c.name, 70),
      metaDescription: truncate(c.description, 160),
    };

    let seoId = existing?.seoId ?? undefined;
    if (seoId) {
      await prisma.seo.update({ where: { id: seoId }, data: seoData });
    } else {
      const seo = await prisma.seo.create({ data: seoData });
      seoId = seo.id;
    }

    await prisma.company.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        websiteUrl: c.websiteUrl,
        country: c.country,
        foundedYear: c.foundedYear,
        description: c.description,
        seoId,
      },
      create: {
        name: c.name,
        slug: c.slug,
        websiteUrl: c.websiteUrl,
        country: c.country,
        foundedYear: c.foundedYear,
        description: c.description,
        seoId,
      },
    });
  }

  console.log(`  Companies: ${companies.length}`);
}

async function upsertTools() {
  const tools = readJson<ToolData[]>("tools/tools.json");
  let skipped = 0;

  for (const t of tools) {
    const category = await prisma.category.findUnique({ where: { slug: t.categorySlug } });
    if (!category) {
      console.warn(`  ⚠ Skipping tool "${t.slug}": category "${t.categorySlug}" not found`);
      skipped++;
      continue;
    }

    const subcategory = t.subcategorySlug
      ? await prisma.subcategory.findUnique({ where: { slug: t.subcategorySlug } })
      : null;
    const company = t.companySlug
      ? await prisma.company.findUnique({ where: { slug: t.companySlug } })
      : null;

    const existing = await prisma.tool.findUnique({ where: { slug: t.slug } });

    // SEO: create/update the Seo row first, then assign its id as a scalar
    // FK on the Tool write below. Passing categoryId/companyId as scalars
    // (which we do, since bulk upsert needs stable slug-keyed lookups, not
    // Prisma's nested-connect "Checked" style) forces the Tool write into
    // the "Unchecked" input variant — mixing that with a nested `seo: {
    // create }` write is exactly the type error fixed earlier in this
    // project's deployment (see docs/content-seeding-audit.md).
    const seoData = {
      metaTitle: truncate(`${t.name} — ${t.tagline}`, 70),
      metaDescription: truncate(t.description, 160),
    };
    let seoId = existing?.seoId ?? undefined;
    if (seoId) {
      await prisma.seo.update({ where: { id: seoId }, data: seoData });
    } else {
      const seo = await prisma.seo.create({ data: seoData });
      seoId = seo.id;
    }

    const tool = await prisma.tool.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        websiteUrl: t.websiteUrl,
        pricingModel: t.pricingModel,
        startingPrice: t.startingPrice,
        currency: t.currency,
        status: t.status,
        isFeatured: t.isFeatured,
        publishedAt: t.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : null,
        categoryId: category.id,
        subcategoryId: subcategory?.id ?? null,
        companyId: company?.id ?? null,
        sourceUrl: t.sourceUrl,
        sourceType: t.sourceType,
        verificationStatus: t.verificationStatus,
        lastVerifiedAt: t.verificationStatus === "SOURCE_CHECKED" ? new Date() : null,
        seoId,
      },
      create: {
        name: t.name,
        slug: t.slug,
        tagline: t.tagline,
        description: t.description,
        websiteUrl: t.websiteUrl,
        pricingModel: t.pricingModel,
        startingPrice: t.startingPrice,
        currency: t.currency,
        status: t.status,
        isFeatured: t.isFeatured,
        publishedAt: t.status === "PUBLISHED" ? new Date() : null,
        categoryId: category.id,
        subcategoryId: subcategory?.id ?? null,
        companyId: company?.id ?? null,
        sourceUrl: t.sourceUrl,
        sourceType: t.sourceType,
        verificationStatus: t.verificationStatus,
        lastVerifiedAt: t.verificationStatus === "SOURCE_CHECKED" ? new Date() : null,
        seoId,
      },
    });

    // Idempotent child rows: delete-then-recreate rather than trying to
    // diff, since these have no natural unique key per item to upsert on.
    await prisma.$transaction([
      prisma.toolFeature.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolPro.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolCon.deleteMany({ where: { toolId: tool.id } }),
      prisma.fAQ.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolTag.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolPlatform.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolIntegration.deleteMany({ where: { toolId: tool.id } }),
    ]);

    if (t.features.length) {
      await prisma.toolFeature.createMany({
        data: t.features.map((title, order) => ({ toolId: tool.id, title, order })),
      });
    }
    if (t.pros.length) {
      await prisma.toolPro.createMany({
        data: t.pros.map((text, order) => ({ toolId: tool.id, text, order })),
      });
    }
    if (t.cons.length) {
      await prisma.toolCon.createMany({
        data: t.cons.map((text, order) => ({ toolId: tool.id, text, order })),
      });
    }
    if (t.faqs.length) {
      await prisma.fAQ.createMany({
        data: t.faqs.map((faq, order) => ({
          toolId: tool.id,
          question: faq.q,
          answer: faq.a,
          order,
        })),
      });
    }

    for (const tagName of t.tagSlugs) {
      const tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (tag) {
        await prisma.toolTag.create({ data: { toolId: tool.id, tagId: tag.id } }).catch(() => {});
      }
    }
    for (const platformName of t.platformSlugs) {
      const platform = await prisma.platform.findUnique({ where: { name: platformName } });
      if (platform) {
        await prisma.toolPlatform
          .create({ data: { toolId: tool.id, platformId: platform.id } })
          .catch(() => {});
      }
    }
    for (const integrationName of t.integrationSlugs) {
      const integration = await prisma.integration.findUnique({ where: { name: integrationName } });
      if (integration) {
        await prisma.toolIntegration
          .create({ data: { toolId: tool.id, integrationId: integration.id } })
          .catch(() => {});
      }
    }
  }

  console.log(`  Tools: ${tools.length - skipped} upserted, ${skipped} skipped (missing category)`);
}

async function upsertCollections() {
  const collections = readJson<CollectionData[]>("collections/collections.json");
  let skippedTools = 0;

  for (const c of collections) {
    const existing = await prisma.collection.findUnique({ where: { slug: c.slug } });

    const seoData = {
      metaTitle: truncate(c.title, 70),
      metaDescription: truncate(c.description, 160),
    };
    let seoId = existing?.seoId ?? undefined;
    if (seoId) {
      await prisma.seo.update({ where: { id: seoId }, data: seoData });
    } else {
      const seo = await prisma.seo.create({ data: seoData });
      seoId = seo.id;
    }

    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { title: c.title, description: c.description, isFeatured: c.isFeatured, seoId },
      create: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        isFeatured: c.isFeatured,
        seoId,
      },
    });

    await prisma.collectionTool.deleteMany({ where: { collectionId: collection.id } });

    for (const [order, toolSlug] of c.toolSlugs.entries()) {
      const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } });
      if (!tool) {
        skippedTools++;
        continue;
      }
      await prisma.collectionTool
        .create({ data: { collectionId: collection.id, toolId: tool.id, order } })
        .catch(() => {});
    }
  }

  console.log(`  Collections: ${collections.length} (${skippedTools} tool refs skipped/missing)`);
}

export async function seedContent() {
  console.log("Seeding content from data/ …");
  await upsertTaxonomy();
  await upsertCompanies();
  await upsertTools();
  await upsertCollections();
  console.log("Content seeding complete.");
}

// Allow running this file directly: `tsx prisma/seed/content.ts`
if (require.main === module) {
  seedContent()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
