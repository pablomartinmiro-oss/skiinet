-- Phase 5: cross-module interconnection — track which module owns each quote item
ALTER TABLE "QuoteItem"
  ADD COLUMN IF NOT EXISTS "moduleType" TEXT;

CREATE INDEX IF NOT EXISTS "QuoteItem_quoteId_moduleType_idx"
  ON "QuoteItem" ("quoteId", "moduleType");
