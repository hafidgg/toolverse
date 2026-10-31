# Separate Preview database (Neon `preview` branch)

**Status: required before any schema migration is merged.**

## Why this is a blocker

`vercel.json` builds with:

```
prisma generate && prisma migrate deploy && next build
```

So **every deploy migrates whatever database its `DIRECT_URL` points at**:

- every Preview deploy (each push to a PR branch) migrates the Preview database;
- every Production deploy (merge to `main`) migrates the Production database.

Today Preview and Production use the **same** Neon database (the default branch,
named `production`). A PR containing a migration would therefore change the production
schema as soon as its Preview build runs, before review or merge. Until the split
below is done and verified, no PR may contain a file under `prisma/migrations/`.

Target state:

| Vercel environment | Neon branch | `DATABASE_URL` | `DIRECT_URL` |
|---|---|---|---|
| Production | `production` | pooled (`-pooler`) | direct |
| Preview | `preview` | pooled (`-pooler`) | direct |
| Development (optional) | local Postgres or `preview` | | |

## Rules while doing this

- Never paste a connection string into chat, an issue, a PR, a commit, a log line, or a
  screenshot. Copy them only between the Neon console and the Vercel form.
- The checks in step 4 confirm which database is used **without** printing any URL.

## 1. Create the Neon `preview` branch

1. Neon Console → project **toolverse** → **Branches** → **Create branch**.
2. Name: `preview`. Parent: `production`. Include data: **current point in time (head)**.
3. Create. Neon creates a compute endpoint for the branch.
4. Optional but recommended: in **Roles**, create a role used only by the `preview`
   branch (or reset its password), so a leaked Preview secret cannot open `production`.

Refreshing later: **Branches → preview → Reset from parent** discards Preview data and
schema and copies `production` again. Do this only when no unmerged migration needs to
stay applied on Preview.

## 2. Copy the two `preview` connection strings

On the `preview` branch → **Connect**:

1. Branch: `preview`. Database: the app database. Role: the role from step 1.
2. **Connection pooling ON** → copy. The host contains `-pooler`. This is `DATABASE_URL`.
3. **Connection pooling OFF** → copy. The host has no `-pooler`. This is `DIRECT_URL`.
4. Both must keep `sslmode=require`.

## 3. Split the variables in Vercel

Vercel → project → **Settings → Environment Variables**.

1. Edit the existing `DATABASE_URL`. Under **Environments**, keep only **Production**
   (untick Preview and Development). Save. Do not change its value.
2. Same for the existing `DIRECT_URL`: only **Production**.
3. **Add** `DATABASE_URL` with the pooled `preview` URL, **Environments: Preview** only.
4. **Add** `DIRECT_URL` with the direct `preview` URL, **Environments: Preview** only.
5. Check the list: each name now appears twice, one row scoped *Production*, one row
   scoped *Preview*. No row may be scoped to both.

Env changes only apply to new deployments. Redeploy in the next step.

## 4. Verify without logging URLs

Use a marker row that only exists in one database.

1. **Redeploy Preview:** Deployments → newest Preview deployment → **Redeploy**
   (uncheck "use existing build cache"). The build log should show
   `prisma migrate deploy` with "No pending migrations to apply". It must not print a
   URL. If it does, stop and remove that output.
2. On the **Preview** deployment URL, sign in to `/admin` and create a tag named
   `preview-marker` (Admin → Tags).
3. Neon Console → **SQL Editor**:
   - branch `preview`: `SELECT slug FROM tags WHERE slug = 'preview-marker';` → **1 row**
   - branch `production`: the same query → **0 rows**
4. **Redeploy Production** (or wait for the next merge). On the production site, check
   that Admin → Tags does **not** list `preview-marker`.
5. Delete the marker tag on the Preview deployment.
6. Optional: Neon → **Monitoring**, select each branch and check that its compute shows
   activity at the time each deployment was visited.

If step 3 shows the marker on `production`, Preview is still on the production database.
Re-check step 3 of section 3 and redeploy before going further.

## 5. Before every migration reaches Production: create a restore point

Neon branches are copy-on-write and take seconds to create. A branch is the simplest
restore point.

1. Neon Console → **Branches → Create branch**.
2. Name: `pre-migration-YYYYMMDD-<migration-name>`. Parent: `production`. Data:
   **current point in time (head)**.
3. Merge the PR. The production deploy runs `prisma migrate deploy`.
4. If the migration breaks something: restore `production` from that branch's point in
   time (Branches → production → **Restore**), or point Production's variables at the
   restore branch temporarily. Then redeploy.
5. Delete old `pre-migration-*` branches after a week. They count toward branch limits.

Point-in-time restore is also available within your Neon plan's history retention
window. Check the window in project settings rather than relying on it.

## 6. Workflow for a PR with a migration

1. Create the migration locally against a local or disposable database (`migrate dev`),
   never `production`.
2. Open the PR. The Preview build migrates **only** the `preview` branch.
3. Test the Preview deployment.
4. Create the restore-point branch (section 5).
5. Merge. The Production build migrates `production`.
6. Check the production site and `npx prisma migrate status` (run locally with
   `DIRECT_URL` for `production` in an untracked `.env`).

## Done checklist (tell the developer when all are true)

- [ ] Neon branch `preview` exists, created from `production`
- [ ] Vercel: `DATABASE_URL` and `DIRECT_URL` each have one Production-only row and one
      Preview-only row
- [ ] Marker test: present on `preview`, absent on `production`
- [ ] Marker deleted
