# Deployment & database migration strategy

## Database: Neon (Frankfurt, `aws-eu-central-1`)

The database is Neon project `toolverse`. Railway is no longer used.
Each environment needs **two** URLs from the same Neon branch:

| Variable | Neon URL | Used by |
|---|---|---|
| `DATABASE_URL` | pooled (host contains `-pooler`) | the app at runtime (Prisma Client) |
| `DIRECT_URL` | direct (no `-pooler`) | Prisma CLI: `migrate deploy`, `migrate status`, `migrate diff` (`directUrl` in `schema.prisma`) |

Migrations must not run through the PgBouncer pooler, which is why `directUrl` exists.

## Current state (Milestone 1)

- Production schema has so far been synced with `prisma db push` from the Vercel
  build (`vercel.json → buildCommand`). There was **no migration history**
  (`prisma/migrations/` held only `.gitkeep`).
- **Interim fix (done):** `--accept-data-loss` was removed from the build command.
  It is now `prisma generate && prisma db push && next build`, so a schema change
  that would drop data **fails the build** instead of silently dropping columns or tables.
- **Baseline migration added:** `prisma/migrations/0_init/migration.sql`, generated
  offline (no database connection) with:

  ```bash
  npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/0_init/migration.sql
  ```

  Review: 788 lines, CREATE TYPE / CREATE TABLE / CREATE INDEX / ADD FOREIGN KEY only.
  It contains no DROP, TRUNCATE or DELETE statements; the only "DELETE" text is in FK
  `ON DELETE CASCADE` clauses. It includes the Phase 2 nullable columns on `"tools"`.

- CI (`.github/workflows/ci.yml`) already runs `prisma migrate deploy` against its
  throwaway Postgres service; with `0_init` present, that now creates the real schema.

## Important: the baseline is NOT proven to match production

`0_init` describes what the Prisma schema *says*. Production was built
incrementally with `db push`, possibly from older schema versions, plus any
manual SQL (e.g. `prisma/PHASE2_SCHEMA_CHANGE.sql`). Index names, defaults,
column types or leftover columns may differ. **Do not mark it applied until the
comparison below shows no differences.**

## Follow-up for the owner (manual, in order)

1. **Check for an existing migration table** in production (read-only):
   ```sql
   SELECT to_regclass('public._prisma_migrations');
   ```
   If it exists and has rows, stop: a history already exists, so reconcile it instead
   of baselining.
2. **Diff production against the baseline (read-only).** From a trusted machine,
   with `DATABASE_URL` pointing at production:
   ```bash
   npx prisma migrate diff \
     --from-url "$DATABASE_URL" \
     --to-schema-datamodel prisma/schema.prisma \
     --script
   ```
   This only reads the schema through introspection. The expected output is an empty
   migration (`-- This is an empty migration.`). If it prints any SQL, resolve those
   differences first, either with a new reviewed migration or by fixing the schema.
   Ideally, test this on a Neon **branch** of production first.
3. **Mark the baseline as applied** (writes one row to `_prisma_migrations`; it
   does not execute the SQL):
   ```bash
   npx prisma migrate resolve --applied 0_init
   ```
   Only do this after step 2 is clean and step 1 confirmed there was no history.
4. **Switch the build command** in `vercel.json` to:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
   Do this in the same deploy, or after step 3. Never before: `migrate deploy` would
   try to run `0_init` against existing tables and fail.
5. From then on, make schema changes with `npm run prisma:migrate` (`migrate dev`)
   against a **local or branch** database, commit the generated migration, and let
   `migrate deploy` apply it. Never run `db push` against production again.

## Why the build still uses `db push` for now

Switching to `migrate deploy` before production is baselined would make every
deploy fail, or attempt to recreate existing tables. Keeping `db push` without
`--accept-data-loss` is the safest interim option: additive changes still apply,
and destructive ones stop the build.

## Never

- `prisma db push --accept-data-loss` against production.
- `prisma migrate reset` / `migrate dev` against production.
- Running `step4_tool_intelligence.sql` or `PHASE2_SCHEMA_CHANGE.sql` without review.
  Both are review-only documents.
