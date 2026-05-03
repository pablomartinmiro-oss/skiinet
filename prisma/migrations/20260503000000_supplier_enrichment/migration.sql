-- PORT-10 Suppliers — enrichment for auto-settlements + admin contacts

ALTER TABLE "Supplier"
  ADD COLUMN "fiscalAddress"           TEXT,
  ADD COLUMN "contactPerson"           TEXT,
  ADD COLUMN "adminEmail"              TEXT,
  ADD COLUMN "settlementDayOfMonth"    INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "autoGenerateSettlements" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SupplierSettlement"
  ADD COLUMN "pdfKey"        TEXT,
  ADD COLUMN "internalNotes" TEXT;
