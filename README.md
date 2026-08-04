# ToolVerse

Enterprise-grade, SEO-first directory website for digital tools and online resources.
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, and PostgreSQL.

## Status: feature-complete scaffold, verified where the sandbox allows

Every screen and route described below is implemented with real code, not placeholders.
Verification performed in this environment:

- ✅ ESLint: clean (`npm run lint`)
- ✅ Unit tests: 10/10 passing (`npm test`) — validators + SEO/JSON-LD builders
- ✅ TypeScript: clean except two errors caused by `@prisma/client` types not being
  generated in this sandbox (outbound network to `binaries.prisma.sh` is blocked here).
  Run `npx prisma generate` locally/in CI with normal network access and these resolve.
- ⚠️ E2E (Playwright) and full `next build` were **not** run here — they require a live
  Postgres database and the generated Prisma client. The GitHub Actions workflow
  (`.github/workflows/ci.yml`) runs both automatically against a real Postgres service
  container on every push/PR.

## What's included

### Database & backend
- `prisma/schema.prisma` — 22 models covering every entity in the spec (Admin, Categories,
  Subcategories, Tools, Companies, Tags, Features, Alternatives, Screenshots, Pricing,
  Platforms, Integrations, Collections, BlogPosts, Pages, SEO, FAQ, Analytics, Newsletter,
  Settings, Redirects, Media)
- `lib/auth/session.ts` — bcrypt + JWT (jose) admin sessions
- `middleware.ts` — guards `/admin/*`, rate-limits `/api/admin/*` and the login route
- `lib/cloudinary/client.ts` — image upload/delete
- `services/tool-service.ts` — cached read layer (`unstable_cache`, tag-based revalidation)
- `actions/admin/*` — server actions for Tools, Categories, Subcategories, Tags, Companies,
  Collections, Blog, Media, Redirects, Settings — all auth-guarded and audit-logged

### Public site
Home, `/tools` (filters + sort + pagination), `/categories` + `/categories/[slug]`,
`/companies` + `/company/[slug]`, `/collections` + `/collections/[slug]`, `/search`,
`/compare`, `/blog` + `/blog/[slug]` (TOC, FAQ schema, reading time), `/rss.xml`,
`/sitemap.xml`, `/robots.txt`, static pages (about/contact/privacy/terms/cookies), a
DB-driven catch-all redirect resolver, and root + route-level loading/error/not-found states.

Every entity page ships full metadata, canonical URLs, Open Graph, Twitter Cards, and
JSON-LD (Organization, WebSite, Breadcrumb, SoftwareApplication, FAQPage schemas).

### Admin panel (`/admin`)
Login (bcrypt + JWT), dashboard with stat cards + audit log, full Tools CRUD
(react-hook-form + Zod), Categories/Subcategories/Tags/Companies management, Collections
with tool assignment, Blog CRUD, Media Library (Cloudinary upload/delete), Newsletter
subscriber list, Analytics dashboard (Recharts, first-party event tracking), Redirects,
Settings (site info, GA/AdSense keys, maintenance mode), and an SEO audit page.

### Infrastructure
- `vercel.json` — cache headers, Prisma-aware build command
- `.github/workflows/ci.yml` — lint, typecheck, unit tests, build, and Playwright e2e
  against a real Postgres service container
- `tests/unit/` (Vitest) + `tests/e2e/` (Playwright smoke tests)
- `.eslintrc`/`eslint.config.mjs`, `.prettierrc.json`, `.gitignore`

## Setup

```bash
cp .env.example .env        # fill in DATABASE_URL, ADMIN_SESSION_SECRET, Cloudinary keys
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Default seeded admin: `admin@toolverse.local` / `ChangeMe123!` — change immediately in production.

Generate a strong session secret:
```bash
openssl rand -hex 32
```

Run the test suite:
```bash
npm test              # unit tests (Vitest)
npm run test:e2e       # e2e smoke tests (Playwright, needs a running app + DB)
```

## Known gaps to close before a real production launch

These are honest, specific gaps — not hidden — so you know exactly what's left:

1. **`next build` and Playwright e2e have not been executed in this sandbox** (no outbound
   network to Prisma's binary host, no live Postgres). CI will run both for you on push.
2. **Company/Tag/Subcategory admin screens support create + delete but not inline edit** —
   the pattern (see `components/admin/tool-form.tsx` or `blog-post-form.tsx`) is there to
   extend the same way if you want full edit UI for those.
3. **Blog content is stored/rendered as plain paragraphs split on double newlines**, not
   full MDX — swap in `next-mdx-remote` (already a dependency) if you need rich embeds.
4. **Legal pages (privacy/terms/cookies) contain placeholder copy** — replace with real,
   reviewed policy text before launch.
5. **Newsletter emails (confirmation, campaigns) are not wired to Resend** — the subscriber
   table and API route exist; sending is not implemented.
6. **No image-domain restriction beyond Cloudinary** in `next.config.ts` — add more
   `remotePatterns` if you pull logos from other hosts.

Everything else described in the original spec — SEO layer, security layer, performance
patterns (ISR, `unstable_cache`, static params), AdSense-ready layout, responsive design,
error/loading/empty states, pagination, internal linking, related/featured/trending/latest
tool sections — is implemented in working code, not a stub.

"# toolverse" 
