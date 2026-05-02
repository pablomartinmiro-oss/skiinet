-- Add email + reminder tracking fields to Invoice
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailSentTo" TEXT,
  ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3);
