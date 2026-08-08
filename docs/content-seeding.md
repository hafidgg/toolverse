# Content Seeding Architecture

## Overview

Content lives as version-controlled JSON in `data/`, gets validated by a
standalone script, and gets upserted into the existing Prisma schema by a
seed engine. Nothing here replaces the existing database, admin panel, or
CRUD actions — it's an additional data-loading layer on top of them.

```
data/
  taxonomy/
    categories.json       25 top-level categories
    subcategories.json    subcategories, each keyed to a parent categorySlug
    tags.json
    platforms.json        matches the base seed's existing 7 platforms
    integrations.json
  companies/
    companies.json
  tools/
    tools.json             the main dataset
  collections/
    collections.json       each references tool slugs from tools.json

prisma/seed/
  index.ts                 entrypoint (npm run prisma:seed / npm run seed)
                            — seeds Admin + Settings, then calls content.ts
  content.ts                the actual upsert engine, exports seedContent()

scripts/
  validate-content.ts       npm run validate-content — checks data/ only,
                             no database connection required
  content-audit.ts          npm run content-audit — reports on the database
                             after seeding
```

## Why JSON instead of a second database/CMS

The task explicitly rules out a second database architecture. JSON files
under version control give the same practical benefits (structured,
reviewable via `git diff`, easy to bulk-edit) without introducing a new
storage system — they're just the seed's input, and the existing Postgres/
Prisma database via the admin panel remains the single system of record
after seeding.

## Idempotency

Every entity is upserted by a stable natural key:

- Taxonomy (categories, subcategories, tags, platforms, integrations):
  upserted by `slug` (or `name`, for platforms/tags/integrations, matching
  their existing unique constraints from the base schema).
- Companies, Tools, Collections: upserted by `slug`.
- Child rows with no natural unique key of their own (tool features, pros,
  cons, FAQs, and the tag/platform/integration join rows) are deleted and
  recreated for the tool on every run, inside a transaction. This is simpler
  and safer than diffing, and it's still fully idempotent — running the seed
  twice in a row produces the same end state, not duplicates.

Running `npm run seed:content` (or the full `npm run seed`) any number of
times converges to the same database state; it never accumulates duplicates.

## The `Seo` relation pattern (important, previously debugged)

`Tool`, `Company`, and `Collection` each own a `seoId` scalar foreign key
pointing at a `Seo` row (see `prisma/schema.prisma`). Earlier in this
project's deployment, mixing that scalar FK with a nested `seo: { create }`
write in the same Prisma call caused a real TypeScript build failure —
Prisma resolves each `create`/`update` call to a single input variant
("Checked" or "Unchecked"), and scalar FKs like `categoryId` force the
Unchecked variant, which doesn't accept a nested relation write for `seo` in
the same call.

The seed engine avoids this by construction: for every entity that owns a
`seoId`, it creates or updates the `Seo` row as a separate step first, then
passes the resulting id as a plain scalar `seoId` in the entity's own
create/update call — the same pattern already used by
`actions/admin/tool-actions.ts` and `actions/admin/content-actions.ts`.

## Provenance fields (`sourceUrl`, `sourceType`, `lastVerifiedAt`, `verificationStatus`)

Added to `Tool` as four additive, optional columns (see
`docs/content-seeding-audit.md` for the full schema-change rationale). They
exist so the dataset can honestly track what's actually been checked against
a live source vs. what's included based on general knowledge — they are
**not** surfaced on any public page; only the admin/data layer reads them
(via `npm run content-audit`).

## SEO

`buildMetadata`/`breadcrumbSchema`/etc. in `lib/seo/metadata.ts` are
untouched — the seed engine populates the `Seo` row's `metaTitle` /
`metaDescription` per entity (truncated to safe lengths), and the existing
public pages pick those up automatically since they already query through
the `seo` relation.

## Safety

The seed engine only ever calls `upsert`, `create`, `update`, `deleteMany`
(scoped to a single tool's child rows), and `groupBy` (read-only, in the
audit script) — never `migrate reset`, never `db push --force-reset`, never
an unscoped `deleteMany`. The four new `Tool` columns are additive
(nullable/defaulted), so applying them via `prisma db push` (this project's
existing deploy-time schema sync mechanism — see `vercel.json`) is
non-destructive.
