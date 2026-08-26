-- ============================================================================
-- Phase 2 — Tier-B tool-intelligence fields
-- ============================================================================

-- Documentation only.
-- The actual schema synchronization is performed by `prisma db push`.
-- Five nullable columns are added to the existing "tools" table.
-- NULL means UNKNOWN.

ALTER TABLE "tools" ADD COLUMN "hasFreePlan" BOOLEAN;
ALTER TABLE "tools" ADD COLUMN "hasApi" BOOLEAN;
ALTER TABLE "tools" ADD COLUMN "commercialUseAllowed" BOOLEAN;
ALTER TABLE "tools" ADD COLUMN "hasBatchProcessing" BOOLEAN;
ALTER TABLE "tools" ADD COLUMN "beginnerFriendly" BOOLEAN;

-- No DROP, RENAME, TYPE change, NOT NULL, or DEFAULT operations.