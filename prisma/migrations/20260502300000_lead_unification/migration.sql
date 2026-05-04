-- Lead unification (PR-1)
--
-- 1. Drop ContactSubmission table (replaced by Lead in all entry points).
--    No tenantId on ContactSubmission (multi-tenant bug). Data was a duplicate
--    of what Lead now stores. If any production data exists it will be lost,
--    but the table was best-effort (route logged "may not exist") and the
--    rate-limit query already tolerated its absence.
--
-- 2. Add Lead.ghlContactId for webhook idempotency (avoid duplicate Lead rows
--    when GHL re-delivers ContactCreate / Survey events).

DROP TABLE IF EXISTS "ContactSubmission";

ALTER TABLE "Lead" ADD COLUMN "ghlContactId" TEXT;

CREATE UNIQUE INDEX "Lead_tenantId_ghlContactId_key"
  ON "Lead"("tenantId", "ghlContactId");
