# Content Seeding — Repository Audit

Performed before writing any seeding code, per Phase 0. Documents what already
exists so the seeding system reuses it instead of duplicating it.

## Existing data layer

- **ORM**: Prisma 6.1.0, PostgreSQL, schema at `prisma/schema.prisma`.
- **Existing seed**: `prisma/seed/index.ts`, run via `npm run prisma:seed`
  (`tsx prisma/seed/index.ts`). Currently seeds: one `Admin`, one `Settings`
  row, 7 `Platform` rows, and a single `Category` ("AI Tools"). No tools,
  companies, tags, subcategories, or collections exist yet. This script will
  be **extended**, not replaced — the admin/settings/platform seeding stays.

## Relevant Prisma models (already defined, not modified unless noted)

- `Category` (name, slug, description, icon, imageUrl, order, isFeatured,
  isActive, seoId → `Seo`)
- `Subcategory` (name, slug, description, order, isActive, categoryId, seoId)
- `Tag` (name, slug, description, isActive)
- `Company` (name, slug, description, logoUrl, websiteUrl, foundedYear,
  country, employeeRange, fundingStage, social URLs, isVerified, isActive,
  seoId)
- `Tool` (name, slug, tagline, description, longDescription, logoUrl,
  websiteUrl, affiliateUrl, pricingModel enum, startingPrice, currency,
  status enum, isFeatured, isVerified, publishedAt, categoryId,
  subcategoryId?, companyId?, tags/features/pros/cons/screenshots/
  pricingPlans/platforms/integrations/faqs relations, seoId)
- `Platform` (name, slug, icon) — already has 7 rows from the base seed.
- `Integration` (name, slug, logoUrl)
- `Collection` (title, slug, description, coverImage, isFeatured, isActive,
  seoId) + `CollectionTool` join table with `order`/`note`.
- `Seo` (metaTitle, metaDescription, canonicalUrl, robots flags, OG/Twitter
  fields, structuredData) — one row per entity via a `seoId` FK owned by the
  entity. **Important existing gotcha** (already fixed once during
  deployment): entities that own `seoId` must be created/updated with the
  scalar `seoId` set directly, not a nested `seo: { create }` write, because
  passing other scalar FKs (categoryId, companyId, etc.) in the same call
  forces Prisma's "Unchecked" input variant, which is incompatible with a
  nested relation write. The seeding engine follows this pattern
  consistently: create the `Seo` row first, then pass its id as `seoId`.

### No provenance fields exist yet (Phase 6)

The schema has no `sourceUrl` / `sourceType` / `lastVerifiedAt` /
`verificationStatus` columns on `Tool`. Adding them is a genuine, minimal,
additive schema change (four new optional columns), not a new database
architecture — implemented as a Prisma migration in this phase. These fields
are populated by the seed data but **not surfaced in any public page** (no
existing UI reads them) — only usable by the admin/data layer for now, per
Phase 6's instruction not to expose verification claims publicly unless the
UI is designed for it (it isn't, and this phase doesn't add that UI).

## Existing admin CRUD (reused, not duplicated)

- `actions/admin/tool-actions.ts` — `createTool`/`updateTool`/`deleteTool`,
  used by the admin UI form. The seed engine does **not** call these (they're
  tuned for single-record form submissions with Zod validation from
  `lib/validators/tool.ts`); it uses direct `prisma.tool.upsert()` calls
  instead, since bulk seeding needs idempotent upserts keyed by slug rather
  than create-only form validation. Same reasoning applies to
  `actions/admin/taxonomy-actions.ts`, `company-actions.ts`,
  `content-actions.ts` (collections/blog) — read for reference, not called
  directly by the seed script.
- Admin list/edit pages already exist for tools, categories, subcategories,
  companies, tags, collections (`app/admin/(dashboard)/...`) — seeded records
  appear there automatically since they're the same tables, no UI changes
  needed.

## Existing SEO helpers (reused)

- `lib/seo/metadata.ts` — `buildMetadata`, `breadcrumbSchema`,
  `softwareApplicationSchema`, `faqSchema`, `toSafeJsonLd`. Already wired
  into `/tools/[slug]`, `/categories/[slug]`, `/company/[slug]`,
  `/collections/[slug]`. No changes needed — seeded `Seo` rows populate these
  automatically once records exist.

## Existing public routes (verified against, not modified)

`/tools`, `/tools/[slug]`, `/categories`, `/categories/[slug]`, `/companies`,
`/company/[slug]`, `/collections`, `/collections/[slug]`, `/search`,
`/compare` — all already handle empty-state and missing-optional-relation
cases (`EmptyState` component, optional chaining on `company`/`subcategory`).

## Search

Existing `/search` implementation (`app/(marketing)/search/page.tsx`) is
server-side via Prisma `contains`/`insensitive` filtering — not client-side.
Per Phase 12's fallback instruction ("if existing search is client-side, keep
it client-side"), this doesn't apply here since it's already server-side;
left unchanged.

## Sitemap

`app/sitemap.ts` already queries published tools, active categories, active
collections, and published blog posts directly from Prisma — will pick up
seeded content automatically with zero changes, and already excludes
drafts/archived/inactive by its existing `where` clauses.

## Conclusion

No second database architecture, no new CRUD system, no new SEO system, and
no new public routes are needed. This phase adds: (1) a `data/` JSON content
source layer, (2) four additive provenance columns on `Tool` via migration,
(3) a seed engine that upserts that JSON into the existing schema, (4) a
content validator, (5) a content audit reporter — all net-new files, zero
replacement of existing working code.
