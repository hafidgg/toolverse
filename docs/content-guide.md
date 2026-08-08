# Content Guide

The editorial standard for anything added to `data/` — read this before adding
a new tool, company, or collection.

## The one absolute rule

**Never invent data.** If you don't know a fact, leave the field `null` or
omit it. A missing price is honest. A guessed price is a bug that will
eventually embarrass the site when someone notices it's wrong.

This applies to every field: pricing, founding year, employee count, funding
stage, integrations, platforms, features — all of it.

## Adding a tool

1. Confirm the tool's **official website** — this is mandatory, not optional.
   Visit it yourself; don't trust a third-party aggregator's URL.
2. Write an **original** description and tagline. Do not paste marketing copy
   from the vendor's site or a competitor directory. A couple of sentences in
   your own words, based on what the product actually does, is enough.
3. Pick exactly one `pricingModel` from the existing enum:
   `FREE`, `FREEMIUM`, `PAID`, `SUBSCRIPTION`, `ONE_TIME`, `OPEN_SOURCE`,
   `CONTACT_SALES`. A free trial does not make something `FREE`. A token
   "free plan" with no real functionality does not make something
   `FREEMIUM` — the free tier has to actually be usable for something.
4. Only set `startingPrice` if you've checked it on the vendor's current
   pricing page. Prices change often — if you're not looking at it right
   now, leave it `null`.
5. Only list `platformSlugs` / `integrationSlugs` the tool actually,
   verifiably supports. Don't assume "probably has a mobile app."
6. Set `verificationStatus`:
   - `UNVERIFIED` — default. Identity (name, official site, category) is
     believed accurate from general knowledge, but nothing was checked live.
   - `SOURCE_CHECKED` — you (or the seeding process) actually visited a
     primary source (usually the official site) and confirmed the specific
     facts recorded, and set `sourceUrl` to that page.
   - `EDITOR_REVIEWED` — reserved for after an actual human editor has
     reviewed the entry end-to-end. Don't set this yourself for a new entry.
7. Add 3–8 `features` as short factual phrases, not marketing adjectives.
8. `pros`/`cons` are editorial observations based on verified capabilities —
   not fabricated user reviews, not a copy of a review site's summary.
9. Add an entry to `data/tools/tools.json`, run `npm run validate-content`,
   fix anything it flags, then `npm run seed:content`.

## Adding a category or subcategory

Categories should represent a genuinely distinct, browsable segment of the
directory — not a synonym for an existing one. Before adding a new one, check
whether an existing category (or a new subcategory under one) already covers
it.

## Adding a company

Same sourcing bar as tools: real name, real official website, and only fill
`foundedYear` / `country` / `employeeRange` / `fundingStage` when you're
confident in the source. It's fine — expected, even — for a company entry to
have several `null` optional fields.

## Adding a collection

A collection needs a clear, specific theme ("Best Free AI Tools", not
"Cool Tools") and 5–20 tools that actually fit it. Don't create a collection
just to add another page to the sitemap.

## Before publishing anything new

```bash
npm run validate-content   # structural + placeholder/fake-data checks
npm run seed:content        # idempotent upsert into the database
npm run content-audit       # post-seed database report
```

`validate-content` catches malformed data before it ever touches the
database. `content-audit` reports on what's actually in the database
afterward — how much is verified, what's missing SEO fields, etc.
