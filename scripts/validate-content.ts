/**
 * Validates every file in data/ for structural integrity and content-quality
 * red flags, independent of the database. Run before seeding — catches the
 * kinds of mistakes that are much cheaper to fix in JSON than after they've
 * been upserted into Postgres.
 *
 * Exits with a non-zero status when any CRITICAL error is found.
 */
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(__dirname, "..", "data");

function readJson<T>(relativePath: string): T {
  const filePath = path.join(DATA_DIR, relativePath);
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Malformed JSON in ${relativePath}: ${(e as Error).message}`);
  }
}

interface Issue {
  level: "CRITICAL" | "WARNING";
  message: string;
}

const issues: Issue[] = [];
function critical(message: string) {
  issues.push({ level: "CRITICAL", message });
}
function warning(message: string) {
  issues.push({ level: "WARNING", message });
}

const URL_RE = /^https?:\/\/.+/i;
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /example tool/i,
  /test company/i,
  /sample description/i,
  /coming soon/i,
  /\btbd\b/i,
  /\btodo\b/i,
];
const FAKE_DOMAINS = ["example.com", "test.com", "localhost", "yoursite.com", "yourcompany.com"];

function isPlaceholder(text: string | null | undefined): boolean {
  if (!text) return false;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(text));
}

function isFakeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return FAKE_DOMAINS.some((d) => url.includes(d));
}

const VALID_PRICING_MODELS = [
  "FREE",
  "FREEMIUM",
  "PAID",
  "SUBSCRIPTION",
  "ONE_TIME",
  "OPEN_SOURCE",
  "CONTACT_SALES",
];

function validate() {
  // ---- Taxonomy ----
  const categories = readJson<{ slug: string; name: string; description?: string }[]>(
    "taxonomy/categories.json"
  );
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const seenCategorySlugs = new Set<string>();
  for (const c of categories) {
    if (seenCategorySlugs.has(c.slug)) critical(`Duplicate category slug: ${c.slug}`);
    seenCategorySlugs.add(c.slug);
    if (isPlaceholder(c.description)) critical(`Placeholder text in category "${c.slug}" description`);
  }

  const subcategories = readJson<{ slug: string; categorySlug: string }[]>(
    "taxonomy/subcategories.json"
  );
  const subcategorySlugs = new Set(subcategories.map((s) => s.slug));
  for (const s of subcategories) {
    if (!categorySlugs.has(s.categorySlug)) {
      critical(`Subcategory "${s.slug}" references nonexistent category "${s.categorySlug}"`);
    }
  }

  const tags = readJson<{ slug: string; name: string }[]>("taxonomy/tags.json");
  const tagNames = new Set(tags.map((t) => t.name));
  const seenTagSlugs = new Set<string>();
  for (const t of tags) {
    if (seenTagSlugs.has(t.slug)) critical(`Duplicate tag slug: ${t.slug}`);
    seenTagSlugs.add(t.slug);
  }

  const platforms = readJson<{ slug: string; name: string }[]>("taxonomy/platforms.json");
  const platformNames = new Set(platforms.map((p) => p.name));

  const integrations = readJson<{ slug: string; name: string }[]>("taxonomy/integrations.json");
  const integrationNames = new Set(integrations.map((i) => i.name));

  // ---- Companies ----
  const companies = readJson<
    { slug: string; name: string; websiteUrl: string; description: string }[]
  >("companies/companies.json");
  const companySlugs = new Set(companies.map((c) => c.slug));
  const seenCompanySlugs = new Set<string>();
  const seenCompanyNames = new Map<string, number>();
  for (const c of companies) {
    if (seenCompanySlugs.has(c.slug)) critical(`Duplicate company slug: ${c.slug}`);
    seenCompanySlugs.add(c.slug);
    seenCompanyNames.set(c.name, (seenCompanyNames.get(c.name) ?? 0) + 1);

    if (!URL_RE.test(c.websiteUrl)) critical(`Company "${c.slug}" has invalid websiteUrl: ${c.websiteUrl}`);
    if (isFakeUrl(c.websiteUrl)) critical(`Company "${c.slug}" uses a placeholder/fake domain: ${c.websiteUrl}`);
    if (!c.description || c.description.trim().length === 0) {
      critical(`Company "${c.slug}" has an empty description`);
    }
    if (isPlaceholder(c.description)) critical(`Placeholder text in company "${c.slug}" description`);
  }
  for (const [name, count] of seenCompanyNames) {
    if (count > 1) warning(`Company name "${name}" appears ${count} times`);
  }

  // ---- Tools ----
  interface ToolData {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    websiteUrl: string;
    pricingModel: string;
    startingPrice: number | null;
    categorySlug: string;
    subcategorySlug: string | null;
    companySlug: string | null;
    platformSlugs: string[];
    integrationSlugs: string[];
    tagSlugs: string[];
    verificationStatus: string;
  }
  const tools = readJson<ToolData[]>("tools/tools.json");
  const toolSlugs = new Set(tools.map((t) => t.slug));
  const seenToolSlugs = new Set<string>();
  const seenToolNames = new Map<string, number>();

  for (const t of tools) {
    if (seenToolSlugs.has(t.slug)) critical(`Duplicate tool slug: ${t.slug}`);
    seenToolSlugs.add(t.slug);
    seenToolNames.set(t.name, (seenToolNames.get(t.name) ?? 0) + 1);

    if (!URL_RE.test(t.websiteUrl)) critical(`Tool "${t.slug}" has invalid/missing official website: ${t.websiteUrl}`);
    if (isFakeUrl(t.websiteUrl)) critical(`Tool "${t.slug}" uses a placeholder/fake domain: ${t.websiteUrl}`);

    if (!VALID_PRICING_MODELS.includes(t.pricingModel)) {
      critical(`Tool "${t.slug}" has invalid pricingModel: ${t.pricingModel}`);
    }

    if (!categorySlugs.has(t.categorySlug)) {
      critical(`Tool "${t.slug}" references nonexistent category "${t.categorySlug}"`);
    }
    if (t.subcategorySlug && !subcategorySlugs.has(t.subcategorySlug)) {
      critical(`Tool "${t.slug}" references nonexistent subcategory "${t.subcategorySlug}"`);
    }
    if (t.companySlug && !companySlugs.has(t.companySlug)) {
      critical(`Tool "${t.slug}" references nonexistent company "${t.companySlug}"`);
    }
    for (const tag of t.tagSlugs) {
      if (!tagNames.has(tag)) critical(`Tool "${t.slug}" references nonexistent tag "${tag}"`);
    }
    for (const p of t.platformSlugs) {
      if (!platformNames.has(p)) critical(`Tool "${t.slug}" references nonexistent platform "${p}"`);
    }
    for (const i of t.integrationSlugs) {
      if (!integrationNames.has(i)) critical(`Tool "${t.slug}" references nonexistent integration "${i}"`);
    }

    if (!t.description || t.description.trim().length < 10) {
      critical(`Tool "${t.slug}" has an empty or too-short description`);
    }
    if (isPlaceholder(t.description) || isPlaceholder(t.tagline)) {
      critical(`Placeholder text in tool "${t.slug}"`);
    }
    if (!["UNVERIFIED", "SOURCE_CHECKED", "EDITOR_REVIEWED"].includes(t.verificationStatus)) {
      critical(`Tool "${t.slug}" has invalid verificationStatus: ${t.verificationStatus}`);
    }
    if (t.startingPrice !== null && t.startingPrice < 0) {
      critical(`Tool "${t.slug}" has a negative startingPrice`);
    }
  }
  for (const [name, count] of seenToolNames) {
    if (count > 1) warning(`Tool name "${name}" appears ${count} times`);
  }

  // ---- Collections ----
  interface CollectionData {
    slug: string;
    title: string;
    description: string;
    toolSlugs: string[];
  }
  const collections = readJson<CollectionData[]>("collections/collections.json");
  const seenCollectionSlugs = new Set<string>();
  for (const c of collections) {
    if (seenCollectionSlugs.has(c.slug)) critical(`Duplicate collection slug: ${c.slug}`);
    seenCollectionSlugs.add(c.slug);

    const seenInThisCollection = new Set<string>();
    for (const toolSlug of c.toolSlugs) {
      if (!toolSlugs.has(toolSlug)) {
        critical(`Collection "${c.slug}" references nonexistent tool "${toolSlug}"`);
      }
      if (seenInThisCollection.has(toolSlug)) {
        critical(`Collection "${c.slug}" lists tool "${toolSlug}" more than once`);
      }
      seenInThisCollection.add(toolSlug);
    }
    if (c.toolSlugs.length === 0) {
      warning(`Collection "${c.slug}" has no tools`);
    }
  }

  // ---- Report ----
  const criticalIssues = issues.filter((i) => i.level === "CRITICAL");
  const warnings = issues.filter((i) => i.level === "WARNING");

  console.log("\nCONTENT VALIDATION\n");
  console.log(`Categories: ${categories.length}`);
  console.log(`Subcategories: ${subcategories.length}`);
  console.log(`Tags: ${tags.length}`);
  console.log(`Platforms: ${platforms.length}`);
  console.log(`Integrations: ${integrations.length}`);
  console.log(`Companies: ${companies.length}`);
  console.log(`Tools: ${tools.length}`);
  console.log(`Collections: ${collections.length}`);
  console.log(`\nCritical errors: ${criticalIssues.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  if (criticalIssues.length > 0) {
    console.log("CRITICAL ERRORS:");
    for (const i of criticalIssues) console.log(`  ✗ ${i.message}`);
    console.log("");
  }
  if (warnings.length > 0) {
    console.log("WARNINGS:");
    for (const i of warnings) console.log(`  ⚠ ${i.message}`);
    console.log("");
  }

  if (criticalIssues.length > 0) {
    console.log("Validation FAILED — fix critical errors above before seeding.\n");
    process.exit(1);
  }

  console.log("Validation PASSED.\n");
}

validate();
