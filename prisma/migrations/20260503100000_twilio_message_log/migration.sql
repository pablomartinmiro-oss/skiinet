-- Twilio message log
--
-- Audit row per outbound SMS/WhatsApp message. Used for billing
-- reconciliation and to trace failed deliveries. Inbound messages are
-- NOT stored here (they go to a Conversation/Message inbox in a future
-- PR — when we replace GHL conversations).

CREATE TABLE "TwilioMessageLog" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "channel"      TEXT NOT NULL,            -- "sms" | "whatsapp"
    "direction"    TEXT NOT NULL DEFAULT 'outbound',  -- "outbound" | "inbound"
    "fromNumber"   TEXT NOT NULL,
    "toNumber"     TEXT NOT NULL,
    "body"         TEXT NOT NULL,
    "twilioSid"    TEXT,                      -- Twilio Message SID for tracing
    "status"       TEXT NOT NULL DEFAULT 'queued',  -- queued|sent|delivered|failed|undelivered
    "errorCode"    TEXT,
    "errorMessage" TEXT,
    "priceCents"   INTEGER,                   -- Twilio reports price after delivery
    "leadId"       TEXT,
    "quoteId"      TEXT,
    "reservationId" TEXT,
    "actorId"      TEXT,                      -- userId for manual sends, null for system
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TwilioMessageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TwilioMessageLog_tenantId_createdAt_idx"
  ON "TwilioMessageLog"("tenantId", "createdAt");
CREATE INDEX "TwilioMessageLog_tenantId_status_idx"
  ON "TwilioMessageLog"("tenantId", "status");
CREATE INDEX "TwilioMessageLog_tenantId_toNumber_idx"
  ON "TwilioMessageLog"("tenantId", "toNumber");
CREATE INDEX "TwilioMessageLog_twilioSid_idx"
  ON "TwilioMessageLog"("twilioSid");

ALTER TABLE "TwilioMessageLog"
  ADD CONSTRAINT "TwilioMessageLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
