-- PORT-01 hardening — Quote.number and Reservation.number
--
-- Sequential, tenant-scoped document numbers wired through
-- generateDocumentNumber() (DocumentCounter + DocumentNumberLog).
-- Format: PRE-2026-0001 (quote), RES-2026-0001 (reservation).
--
-- Nullable for backwards compatibility with already-issued rows.
-- New rows produced by production code will always have a number.

ALTER TABLE "Quote" ADD COLUMN "number" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "number" TEXT;

CREATE UNIQUE INDEX "Quote_tenantId_number_key"
  ON "Quote"("tenantId", "number");

CREATE UNIQUE INDEX "Reservation_tenantId_number_key"
  ON "Reservation"("tenantId", "number");
