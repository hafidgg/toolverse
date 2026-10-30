# Deployment & database migration strategy

## Database: Neon (Frankfurt, `aws-eu-central-1`)

The database is Neon project `toolverse`. Railway is no longer used.
Each environment needs **two** URLs from the same Neon branch:

| Variable | Neon URL | Used by |
|---|---|---|
| `DATABASE_URL` | pooled (host contains `-pooler`) | the app at runtime (Prisma Client) |
| `DIRECT_URL` | direct (no `-pooler`) | Prisma CLI: `migrate deploy`, `migrate status`, `migrate diff` (`directUrl` in `schema.prisma`) |

Migrations must not run through the PgBouncer pooler, which is why `directUrl` exists.

## Current state

- **Railway is retired.** Production and Preview use Neon (see above).
- **Migrations are the only schema-change path.** The Vercel build command is:

  ```
  prisma generate && prisma migrate deploy && next build
  ```

  `prisma db push` is no longer used anywhere in deployment.
- `prisma/migrations/0_init` is the baseline. It was generated offline with
  `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`;
  it only creates objects (no DROP, TRUNCATE or DELETE). On the new, empty Neon
  database it is applied normally by `migrate deploy`, so no `migrate resolve`
  baselining is needed.

## Initializing an empty Neon branch (one-time)

Run from a machine that can reach Neon on port 5432, with `.env` pointing at the target branch:

```bash
# 1. read-only: must list no tables in schema public
# 2. apply the baseline and confirm
npx prisma migrate deploy
npx prisma migrate status        # "Database schema is up to date!"
# 3. seed
npm run seed                     # admin user + base data
npm run seed:content             # categories, companies, tools, collections from data/
```

Change the seeded admin password immediately after the first login.

## Making schema changes from now on

1. Edit `prisma/schema.prisma`.
2. `npm run prisma:migrate -- --name <change>` (`migrate dev`) against a **local
   database or a disposable Neon branch**, never `production`.
3. Review the generated `migration.sql` for destructive statements and commit it.
4. Deploying runs `prisma migrate deploy` (Preview against the Neon `preview` branch,
   Production against `production`).

## Never

- `prisma db push` (with or without `--accept-data-loss`) against Neon `production`.
- `prisma migrate reset` / `migrate dev` against `production`.
- Running `step4_tool_intelligence.sql` or `PHASE2_SCHEMA_CHANGE.sql` without review.
  Both are review-only documents.
