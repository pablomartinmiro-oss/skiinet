-- PORT-11 REAV — workflow fields
--
-- Minimum enrichment so REAV expedients can be tracked through their
-- fiscal and operative lifecycle. Heavier enrichment of cost/document
-- detail fields is deferred to a follow-up PR.

ALTER TABLE "ReavExpedient"
  ADD COLUMN "expedientNumber" TEXT,
  ADD COLUMN "fiscalStatus"    TEXT NOT NULL DEFAULT 'borrador',
  ADD COLUMN "operativeStatus" TEXT NOT NULL DEFAULT 'pendiente';

CREATE UNIQUE INDEX "ReavExpedient_tenantId_expedientNumber_key"
  ON "ReavExpedient"("tenantId", "expedientNumber");
CREATE INDEX "ReavExpedient_tenantId_fiscalStatus_idx"
  ON "ReavExpedient"("tenantId", "fiscalStatus");
CREATE INDEX "ReavExpedient_tenantId_operativeStatus_idx"
  ON "ReavExpedient"("tenantId", "operativeStatus");
