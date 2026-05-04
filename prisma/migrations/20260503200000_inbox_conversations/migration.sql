-- Inbox unificado — Conversation + Message
--
-- Reemplaza la dependencia de GHL para conversations cuando el equipo
-- responde mensajes. Soporta SMS, WhatsApp, email y voice (transcripts
-- de VAPI). Inbound entran vía webhooks (Twilio, VAPI, Resend events).

CREATE TABLE "Conversation" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "leadId"         TEXT,
    "clientId"       TEXT,
    "channel"        TEXT NOT NULL,                 -- "sms" | "whatsapp" | "email" | "voice"
    "channelRef"     TEXT NOT NULL,                 -- phone E.164 / email / vapi callId
    "subject"        TEXT,
    "status"         TEXT NOT NULL DEFAULT 'open',  -- "open" | "snoozed" | "closed"
    "assignedTo"     TEXT,
    "lastMessageAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageBody" TEXT,
    "lastMessageDirection" TEXT,                    -- "inbound" | "outbound"
    "unreadCount"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Conversation_tenantId_status_lastMessageAt_idx"
  ON "Conversation"("tenantId", "status", "lastMessageAt");
CREATE INDEX "Conversation_tenantId_channel_channelRef_idx"
  ON "Conversation"("tenantId", "channel", "channelRef");
CREATE INDEX "Conversation_tenantId_assignedTo_idx"
  ON "Conversation"("tenantId", "assignedTo");

ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL;
ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL;

CREATE TABLE "InboxMessage" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "conversationId"  TEXT NOT NULL,
    "direction"       TEXT NOT NULL,                -- "inbound" | "outbound"
    "channel"         TEXT NOT NULL,                -- mirror of conversation.channel
    "fromAddr"        TEXT NOT NULL,                -- phone or email
    "toAddr"          TEXT NOT NULL,
    "body"            TEXT NOT NULL,
    "externalId"      TEXT,                         -- Twilio Message SID / Resend id / VAPI message id
    "rawProvider"     TEXT,                         -- "twilio" | "vapi" | "resend"
    "status"          TEXT,                         -- delivered|failed|read (provider-dependent)
    "errorMessage"    TEXT,
    "media"           JSONB,                        -- [{ url, contentType }] for MMS / WhatsApp media
    "actorId"         TEXT,                         -- userId for outbound manual sends; null for inbound/system
    "sentAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt"          TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InboxMessage_tenantId_conversationId_sentAt_idx"
  ON "InboxMessage"("tenantId", "conversationId", "sentAt");
CREATE INDEX "InboxMessage_tenantId_externalId_idx"
  ON "InboxMessage"("tenantId", "externalId");

ALTER TABLE "InboxMessage"
  ADD CONSTRAINT "InboxMessage_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InboxMessage"
  ADD CONSTRAINT "InboxMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE;
