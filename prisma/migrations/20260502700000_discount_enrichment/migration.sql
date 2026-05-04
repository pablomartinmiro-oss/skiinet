-- PORT-07 Discounts enrichment

ALTER TABLE "DiscountCode"
  ADD COLUMN "name"                  TEXT,
  ADD COLUMN "description"           TEXT,
  ADD COLUMN "observations"          TEXT,
  ADD COLUMN "origin"                TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "compensationVoucherId" TEXT,
  ADD COLUMN "clientEmail"           TEXT,
  ADD COLUMN "clientName"            TEXT;

CREATE INDEX "DiscountCode_tenantId_origin_idx"
  ON "DiscountCode"("tenantId", "origin");
CREATE INDEX "DiscountCode_compensationVoucherId_idx"
  ON "DiscountCode"("compensationVoucherId");
