# Security TODO (manual — nothing here has been done automatically)

Audit of 2026-10-30 (Milestone 1). No step below has been verified as done.

## Findings

- `.env` is listed in `.gitignore` and has **never been committed** (checked full
  history with `git log --all -- .env`).
- `.env.example` history (commits `82497c0`, `957f9d6`) contains only
  placeholder values (`USER:PASSWORD@ep-xxxx…`, `replace-with…`), not real secrets.
- `Test-NetConnection` (an empty, accidentally created file) was tracked; it is
  now untracked and ignored. `.next/` and `tsconfig.tsbuildinfo` were not tracked.
- `prisma/seed/index.ts` creates the admin `admin@toolverse.local` with the
  default password `ChangeMe123!`.

Even though no secret was found in Git, the credentials below have been shared
across local machines, chat sessions and deployment tooling, so rotate them
before launch.

## Checklist

- [ ] Rotate the Neon database password (Neon console → Roles → Reset password),
      then update `DATABASE_URL` (and `DIRECT_URL` if used) in Vercel and locally.
      Also check which database the local `.env` points to — at audit time it was a
      remote host, not a local database.
- [ ] Rotate `ADMIN_SESSION_SECRET` (`openssl rand -base64 48`) in Vercel. All
      admin sessions are invalidated, which is expected.
- [ ] Confirm the default admin password `ChangeMe123!` has been changed in
      production (log in with it; it must fail). Change it via Admin → Settings.
- [ ] Configure Upstash Redis for production rate limiting
      (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Without them,
      `lib/rate-limit` falls back to a per-instance in-memory limiter that gives no
      real protection on Vercel.
- [ ] Verify Vercel environment variables (Production + Preview): `DATABASE_URL`,
      `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, Upstash, Resend, Cloudinary.
      Make sure Preview does not point at the production database.
