import { PrismaClient, type PricingModel, type VerificationStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
// process.cwd() is the project root in both local dev and Vercel's Node.js
// serverless runtime (/var/task) — reliable there. __dirname-based relative
// traversal (e.g. path.join(__dirname, "..", "..", "data")) is NOT safe here:
// Next.js bundles this file for the API route, which can flatten/relocate
// it relative to its original source position, so __dirname at runtime
// doesn't necessarily match the source tree layout.
const DATA_DIR = path.join(process.cwd(), "data");

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
  let subcategorySkipped = 0;
  for (const s of subcategories) {
    const category = await prisma.category.findUnique({ where: { slug: s.categorySlug } });
    if (!category) {
      console.warn(`  ⚠ Skipping subcategory "${s.slug}": category "${s.categorySlug}" not found`);
      subcategorySkipped++;
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
    `  Taxonomy: ${platforms.length} platforms, ${integrations.length} integrations, ${categories.length} categories, ${subcategories.length - subcategorySkipped}/${subcategories.length} subcategories, ${tags.length} tags`
  );

  return {
    platforms: platforms.length,
    integrations: integrations.length,
    categories: categories.length,
    subcategories: subcategories.length - subcategorySkipped,
    tags: tags.length,
  };
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
  return { companies: companies.length };
}

async function upsertTools(
  offset = 0,
  limit?: number
): Promise<{
  input: number;
  totalInDataset: number;
  upserted: number;
  skipped: { slug: string; reason: string }[];
  nextOffset: number | null;
}> {
  const allTools = readJson<ToolData[]>("tools/tools.json");
  const tools = limit ? allTools.slice(offset, offset + limit) : allTools.slice(offset);
  const nextOffset = limit && offset + limit < allTools.length ? offset + limit : null;

  const skipped: { slug: string; reason: string }[] = [];
  let upserted = 0;

  // Precompute lookup maps once instead of re-querying per tool — this is
  // the main fix for the production issue where the tools phase was
  // dramatically slower than the companies phase (which does far fewer
  // round trips per record): each tool previously did up to ~15-20
  // sequential DB round trips (category/subcategory/company/existing-tool
  // lookups, then an individual findUnique+create per tag/platform/
  // integration). Against a remote Postgres instance, that easily pushed
  // total execution past a serverless function's time budget, silently
  // truncating the run after however many tools fit in the window — with
  // no error, since the process is killed from outside, not thrown from
  // within. Companies fully completed because that phase does far less
  // per-record work.
  //
  // Batching (offset/limit) is a second, independent layer of defense on
  // top of that: Vercel's Hobby plan enforces a hard ~10s serverless
  // function timeout that a route's own `maxDuration` cannot override
  // (that only takes effect on paid plans) — so even the optimized
  // per-tool cost can still add up past 10s across all 57 tools in one
  // request. Processing a bounded slice per invocation keeps each call
  // comfortably short regardless of plan.
  const [allCategories, allSubcategories, allCompanies, allTags, allPlatforms, allIntegrations] =
    await Promise.all([
      prisma.category.findMany({ select: { id: true, slug: true } }),
      prisma.subcategory.findMany({ select: { id: true, slug: true } }),
      prisma.company.findMany({ select: { id: true, slug: true } }),
      prisma.tag.findMany({ select: { id: true, name: true } }),
      prisma.platform.findMany({ select: { id: true, name: true } }),
      prisma.integration.findMany({ select: { id: true, name: true } }),
    ]);
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  const subcategoryBySlug = new Map(allSubcategories.map((s) => [s.slug, s.id]));
  const companyBySlug = new Map(allCompanies.map((c) => [c.slug, c.id]));
  const tagByName = new Map(allTags.map((t) => [t.name, t.id]));
  const platformByName = new Map(allPlatforms.map((p) => [p.name, p.id]));
  const integrationByName = new Map(allIntegrations.map((i) => [i.name, i.id]));

  for (const t of tools) {
    try {
      const categoryId = categoryBySlug.get(t.categorySlug);
      if (!categoryId) {
        skipped.push({ slug: t.slug, reason: `category "${t.categorySlug}" not found` });
        continue;
      }
      if (t.subcategorySlug && !subcategoryBySlug.has(t.subcategorySlug)) {
        skipped.push({ slug: t.slug, reason: `subcategory "${t.subcategorySlug}" not found` });
        continue;
      }
      if (t.companySlug && !companyBySlug.has(t.companySlug)) {
        skipped.push({ slug: t.slug, reason: `company "${t.companySlug}" not found` });
        continue;
      }

      const subcategoryId = t.subcategorySlug ? subcategoryBySlug.get(t.subcategorySlug) : undefined;
      const companyId = t.companySlug ? companyBySlug.get(t.companySlug) : undefined;

      const existing = await prisma.tool.findUnique({ where: { slug: t.slug } });

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

      const commonData = {
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        websiteUrl: t.websiteUrl,
        pricingModel: t.pricingModel,
        startingPrice: t.startingPrice,
        currency: t.currency,
        status: t.status,
        isFeatured: t.isFeatured,
        categoryId,
        subcategoryId: subcategoryId ?? null,
        companyId: companyId ?? null,
        sourceUrl: t.sourceUrl,
        sourceType: t.sourceType,
        verificationStatus: t.verificationStatus,
        lastVerifiedAt: t.verificationStatus === "SOURCE_CHECKED" ? new Date() : null,
        seoId,
      };

      const tool = await prisma.tool.upsert({
        where: { slug: t.slug },
        update: {
          ...commonData,
          publishedAt: t.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : null,
        },
        create: {
          ...commonData,
          slug: t.slug,
          publishedAt: t.status === "PUBLISHED" ? new Date() : null,
        },
      });

      // Idempotent child rows: delete-then-recreate rather than diffing,
      // since these have no natural unique key per item to upsert on.
      // Batched into one transaction (unchanged) plus batched createMany
      // calls below (changed from individual per-item create+catch loops).
      await prisma.$transaction([
        prisma.toolFeature.deleteMany({ where: { toolId: tool.id } }),
        prisma.toolPro.deleteMany({ where: { toolId: tool.id } }),
        prisma.toolCon.deleteMany({ where: { toolId: tool.id } }),
        prisma.fAQ.deleteMany({ where: { toolId: tool.id } }),
        prisma.toolTag.deleteMany({ where: { toolId: tool.id } }),
        prisma.toolPlatform.deleteMany({ where: { toolId: tool.id } }),
        prisma.toolIntegration.deleteMany({ where: { toolId: tool.id } }),
      ]);

      const writes: Promise<unknown>[] = [];
      if (t.features.length) {
        writes.push(
          prisma.toolFeature.createMany({
            data: t.features.map((title, order) => ({ toolId: tool.id, title, order })),
          })
        );
      }
      if (t.pros.length) {
        writes.push(
          prisma.toolPro.createMany({
            data: t.pros.map((text, order) => ({ toolId: tool.id, text, order })),
          })
        );
      }
      if (t.cons.length) {
        writes.push(
          prisma.toolCon.createMany({
            data: t.cons.map((text, order) => ({ toolId: tool.id, text, order })),
          })
        );
      }
      if (t.faqs.length) {
        writes.push(
          prisma.fAQ.createMany({
            data: t.faqs.map((faq, order) => ({
              toolId: tool.id,
              question: faq.q,
              answer: faq.a,
              order,
            })),
          })
        );
      }

      const tagIds = t.tagSlugs.map((n) => tagByName.get(n)).filter((id): id is string => !!id);
      if (tagIds.length) {
        writes.push(
          prisma.toolTag.createMany({
            data: tagIds.map((tagId) => ({ toolId: tool.id, tagId })),
            skipDuplicates: true,
          })
        );
      }
      const platformIds = t.platformSlugs
        .map((n) => platformByName.get(n))
        .filter((id): id is string => !!id);
      if (platformIds.length) {
        writes.push(
          prisma.toolPlatform.createMany({
            data: platformIds.map((platformId) => ({ toolId: tool.id, platformId })),
            skipDuplicates: true,
          })
        );
      }
      const integrationIds = t.integrationSlugs
        .map((n) => integrationByName.get(n))
        .filter((id): id is string => !!id);
      if (integrationIds.length) {
        writes.push(
          prisma.toolIntegration.createMany({
            data: integrationIds.map((integrationId) => ({ toolId: tool.id, integrationId })),
            skipDuplicates: true,
          })
        );
      }

      await Promise.all(writes);
      upserted++;
    } catch (error) {
      skipped.push({
        slug: t.slug,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`  Tools: ${upserted} upserted, ${skipped.length} skipped`);
  if (skipped.length > 0) {
    console.log("  Skipped tools:");
    for (const s of skipped) console.log(`    - ${s.slug} → ${s.reason}`);
  } else {
    console.log("  Skipped tools: none");
  }

  return { input: tools.length, totalInDataset: allTools.length, upserted, skipped, nextOffset };
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
  return { collections: collections.length, skippedToolRefs: skippedTools };
}

export interface SeedSummary {
  categories: number;
  subcategories: number;
  companies: number;
  tools: {
    input: number;
    totalInDataset: number;
    upserted: number;
    skipped: { slug: string; reason: string }[];
    nextOffset: number | null;
  };
  collections: number;
}

/**
 * Full, unbatched seed — taxonomy, companies, every tool in one pass, then
 * collections. Fine for local `npm run seed` (no serverless timeout to
 * worry about). On Vercel, prefer calling `seedTaxonomyAndCompanies()` once
 * followed by repeated `seedToolsBatch()` calls, then `seedCollections()` —
 * see app/api/admin/seed-content-once/route.ts.
 */
export async function seedContent(): Promise<SeedSummary> {
  console.log("Seeding content from data/ …");
  const taxonomy = await upsertTaxonomy();
  const companies = await upsertCompanies();
  const tools = await upsertTools();
  const collections = await upsertCollections();
  console.log("Content seeding complete.");

  return {
    categories: taxonomy.categories,
    subcategories: taxonomy.subcategories,
    companies: companies.companies,
    tools,
    collections: collections.collections,
  };
}

/** Taxonomy + companies only — fast, safe to run in a single short request. */
export async function seedTaxonomyAndCompanies() {
  const taxonomy = await upsertTaxonomy();
  const companies = await upsertCompanies();
  return { taxonomy, companies };
}

/**
 * Processes one bounded slice of tools.json, starting at `offset`. Returns
 * `nextOffset: null` once the dataset is exhausted. Designed to be called
 * repeatedly from a route handler until done — each call stays well within
 * even a 10-second serverless timeout regardless of hosting plan.
 */
export async function seedToolsBatch(offset: number, limit: number) {
  return upsertTools(offset, limit);
}

/** Collections reference tools by slug — run this only after all tool batches are done. */
export async function seedCollections() {
  return upsertCollections();
}

// Allow running this file directly: `tsx prisma/seed/content.ts`
if (require.main === module) {
  seedContent()
    .then((summary) => {
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
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}