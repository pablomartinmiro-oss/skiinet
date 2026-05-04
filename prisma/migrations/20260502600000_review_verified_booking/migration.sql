-- PORT-08 Reviews adapt — verified booking flag
--
-- Set true when the reviewer's email matches a Reservation in this tenant
-- (any status). Used to render a "Reserva verificada" badge on public
-- listings and as a trust signal in admin dashboards.

ALTER TABLE "Review" ADD COLUMN "verifiedBooking" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Review_tenantId_verifiedBooking_idx"
  ON "Review"("tenantId", "verifiedBooking");
