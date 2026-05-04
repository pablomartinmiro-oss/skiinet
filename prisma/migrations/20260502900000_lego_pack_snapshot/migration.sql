-- PORT-12 Lego Packs — pricing snapshot
--
-- When a Lego pack is sold (via TPV, reservation or quote) we freeze
-- the pack composition and price at that moment so future pack edits
-- never re-write old documents fiscally.

CREATE TABLE "LegoPackSnapshot" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "packId"         TEXT NOT NULL,
    "packTitle"      TEXT NOT NULL,
    "packSlug"       TEXT,
    "operationType"  TEXT NOT NULL,           -- "tpv_sale" | "reservation" | "quote"
    "operationId"    TEXT NOT NULL,
    "pricedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPrice"     DOUBLE PRECISION NOT NULL,
    "linesJson"      JSONB NOT NULL,          -- [{ lineId, productId?, quantity, unitPrice, totalPrice, label }]
    "currency"       TEXT NOT NULL DEFAULT 'EUR',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegoPackSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LegoPackSnapshot_tenantId_packId_idx"
  ON "LegoPackSnapshot"("tenantId", "packId");
CREATE INDEX "LegoPackSnapshot_tenantId_operationType_operationId_idx"
  ON "LegoPackSnapshot"("tenantId", "operationType", "operationId");

ALTER TABLE "LegoPackSnapshot"
  ADD CONSTRAINT "LegoPackSnapshot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
