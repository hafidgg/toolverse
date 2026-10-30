# Temporary brand assets

These are **plain placeholders** (a "TV" monogram plus the "ToolVerse" wordmark in
Arial on a neutral background). They exist so `/og-default.png`, `/logo.png` and the
favicon stop returning 404. Replace them with real branding:

| File | Used by | Required size |
|---|---|---|
| `public/og-default.png` | default Open Graph / Twitter image (`lib/seo/metadata.ts`) | 1200 × 630 PNG |
| `public/logo.png` | Organization JSON-LD `logo` (`lib/seo/metadata.ts`) | square PNG, ≥ 112 × 112 (512 × 512 now) |
| `app/icon.svg` | favicon (Next.js file convention) | square SVG, or replace with `app/icon.png` |

They contain no badges, certifications or third-party marks.
