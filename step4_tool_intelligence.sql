-- =====================================================================
-- STEP 4 — SAFE DATABASE POPULATION (review-only script, NOT executed)
-- Tool Intelligence Data Pass — Phase 2 fields
-- Target table: "tools" (Prisma model Tool, @@map("tools"))
-- =====================================================================

SELECT
  id, slug, "hasFreePlan", "hasApi", "commercialUseAllowed",
  "hasBatchProcessing", "beginnerFriendly"
FROM "tools"
WHERE slug IN ('chatgpt','claude','notion','figma','github-copilot','canva')
ORDER BY slug;

SELECT COUNT(*) AS matching_row_count
FROM "tools"
WHERE slug IN ('chatgpt','claude','notion','figma','github-copilot','canva');

BEGIN;

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = true, "commercialUseAllowed" = true,
  "hasBatchProcessing" = true, "beginnerFriendly" = NULL
WHERE slug = 'chatgpt';

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = true, "commercialUseAllowed" = true,
  "hasBatchProcessing" = true, "beginnerFriendly" = NULL
WHERE slug = 'claude';

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = true, "commercialUseAllowed" = NULL,
  "hasBatchProcessing" = NULL, "beginnerFriendly" = NULL
WHERE slug = 'notion';

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = true, "commercialUseAllowed" = true,
  "hasBatchProcessing" = NULL, "beginnerFriendly" = NULL
WHERE slug = 'figma';

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = NULL, "commercialUseAllowed" = true,
  "hasBatchProcessing" = NULL, "beginnerFriendly" = NULL
WHERE slug = 'github-copilot';

UPDATE "tools" SET
  "hasFreePlan" = true, "hasApi" = true, "commercialUseAllowed" = true,
  "hasBatchProcessing" = true, "beginnerFriendly" = true
WHERE slug = 'canva';

DO $$
DECLARE
  mismatch_count integer;
  matched_count   integer;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM "tools" t
  JOIN (VALUES
    ('chatgpt'::text,        true,  true,  true,  true,  NULL::boolean),
    ('claude',               true,  true,  true,  true,  NULL),
    ('notion',               true,  true,  NULL,  NULL,  NULL),
    ('figma',                true,  true,  true,  NULL,  NULL),
    ('github-copilot',       true,  NULL,  true,  NULL,  NULL),
    ('canva',                true,  true,  true,  true,  true)
  ) AS expected(slug, hasFreePlan, hasApi, commercialUseAllowed, hasBatchProcessing, beginnerFriendly)
    ON t.slug = expected.slug
  WHERE NOT (
        t."hasFreePlan"          IS NOT DISTINCT FROM expected.hasFreePlan
    AND t."hasApi"                IS NOT DISTINCT FROM expected.hasApi
    AND t."commercialUseAllowed"  IS NOT DISTINCT FROM expected.commercialUseAllowed
    AND t."hasBatchProcessing"    IS NOT DISTINCT FROM expected.hasBatchProcessing
    AND t."beginnerFriendly"      IS NOT DISTINCT FROM expected.beginnerFriendly
  );

  SELECT COUNT(*) INTO matched_count
  FROM "tools"
  WHERE slug IN ('chatgpt','claude','notion','figma','github-copilot','canva');

  IF mismatch_count <> 0 THEN
    RAISE EXCEPTION 'Verification failed: % row(s) do not match the approved dataset. Rolling back.', mismatch_count;
  END IF;

  IF matched_count <> 6 THEN
    RAISE EXCEPTION 'Verification failed: expected exactly 6 matching rows, found %. Rolling back.', matched_count;
  END IF;

  RAISE NOTICE 'Verification passed: all 6 rows match the approved dataset exactly.';
END $$;

COMMIT;

SELECT
  id, slug, "hasFreePlan", "hasApi", "commercialUseAllowed",
  "hasBatchProcessing", "beginnerFriendly"
FROM "tools"
WHERE slug IN ('chatgpt','claude','notion','figma','github-copilot','canva')
ORDER BY slug;
