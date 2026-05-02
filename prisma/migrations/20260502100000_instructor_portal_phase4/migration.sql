-- Phase 4: Instructor portal — geolocation on clock-out + internal chat

-- 1. Clock-out geolocation on InstructorTimeEntry
ALTER TABLE "InstructorTimeEntry"
  ADD COLUMN IF NOT EXISTS "clockOutLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "clockOutLon" DOUBLE PRECISION;

-- 2. Internal chat: Message model
CREATE TABLE IF NOT EXISTS "Message" (
  "id"         TEXT PRIMARY KEY,
  "tenantId"   TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId"   TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "isRead"     BOOLEAN NOT NULL DEFAULT false,
  "readAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Message_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "Message_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Message_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Message_tenantId_toUserId_isRead_idx"
  ON "Message" ("tenantId", "toUserId", "isRead");

CREATE INDEX IF NOT EXISTS "Message_tenantId_fromUserId_createdAt_idx"
  ON "Message" ("tenantId", "fromUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "Message_toUserId_createdAt_idx"
  ON "Message" ("toUserId", "createdAt");
