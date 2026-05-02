/**
 * Document Numbering Service
 *
 * Generates sequential, auditable document numbers for all document types.
 * Format: "{PREFIX}{YEAR}-{SEQUENCE:04d}" e.g. "FAC-2026-0001"
 *
 * Rules:
 * - Never reuses numbers
 * - Never modifies already-issued numbers
 * - Annual reset (counter per type per year)
 * - Audit log in DocumentNumberLog
 * - Atomic upsert to prevent race conditions
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient | typeof prisma;

const SEQUENCE_PADDING = 4;

export type DocumentType =
  | "invoice"
  | "quote"
  | "reservation"
  | "tpv"
  | "coupon"
  | "settlement"
  | "cancellation"
  | "credit_note";

export const DEFAULT_PREFIXES: Record<DocumentType, string> = {
  invoice: "FAC-",
  quote: "PRE-",
  reservation: "RES-",
  tpv: "TPV-",
  coupon: "CUP-",
  settlement: "LIQ-",
  cancellation: "ANU-",
  credit_note: "ABN-",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: "Facturas",
  quote: "Presupuestos",
  reservation: "Reservas",
  tpv: "Tickets TPV",
  coupon: "Cupones",
  settlement: "Liquidaciones",
  cancellation: "Anulaciones",
  credit_note: "Abonos",
};

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  "invoice",
  "quote",
  "reservation",
  "tpv",
  "coupon",
  "settlement",
  "cancellation",
  "credit_note",
];

/**
 * Generate the next sequential document number atomically.
 *
 * Uses upsert + raw SQL increment to prevent duplicates under concurrency.
 * Can accept an optional Prisma transaction client for use within $transaction blocks.
 */
export async function generateDocumentNumber(
  tenantId: string,
  type: DocumentType,
  opts?: {
    tx?: TransactionClient;
    generatedBy?: string;
    context?: string;
  }
): Promise<string> {
  const db = opts?.tx ?? prisma;
  const year = new Date().getFullYear();
  const prefix = DEFAULT_PREFIXES[type];
  const log = logger.child({ tenantId, documentType: type, year });

  // Step 1: Upsert counter — create if not exists, then increment atomically
  // Using raw SQL for atomic increment to prevent race conditions
  const result = await db.$queryRawUnsafe<
    Array<{ currentNumber: number; prefix: string }>
  >(
    `INSERT INTO "DocumentCounter" ("id", "tenantId", "documentType", "year", "currentNumber", "prefix", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, 1, $4, NOW())
     ON CONFLICT ("tenantId", "documentType", "year")
     DO UPDATE SET "currentNumber" = "DocumentCounter"."currentNumber" + 1, "updatedAt" = NOW()
     RETURNING "currentNumber", "prefix"`,
    tenantId,
    type,
    year,
    prefix
  );

  const counter = result[0];
  if (!counter) {
    throw new Error(
      `Failed to generate document number for ${type}/${year}`
    );
  }

  const sequence = counter.currentNumber;
  const actualPrefix = counter.prefix;
  const documentNumber = `${actualPrefix}${year}-${String(sequence).padStart(SEQUENCE_PADDING, "0")}`;

  // Step 2: Audit log (non-blocking — don't fail if log insert fails)
  try {
    await db.documentNumberLog.create({
      data: {
        tenantId,
        documentType: type,
        documentNumber,
        year,
        sequence,
        generatedBy: opts?.generatedBy ?? "system",
        context: opts?.context ?? "auto",
      },
    });
  } catch (logErr) {
    log.error({ err: logErr }, "Failed to write document number audit log");
  }

  log.info({ documentNumber, sequence }, "Document number generated");
  return documentNumber;
}

/**
 * Get all document counters for a tenant (current year by default).
 */
export async function getCounters(tenantId: string, year?: number) {
  const where = year
    ? { tenantId, year }
    : { tenantId };

  return prisma.documentCounter.findMany({
    where,
    orderBy: { documentType: "asc" },
  });
}

/**
 * Update the prefix for a document type counter.
 * Does NOT affect already-issued numbers.
 */
export async function updatePrefix(
  tenantId: string,
  counterId: string,
  newPrefix: string
) {
  return prisma.documentCounter.update({
    where: { id: counterId, tenantId },
    data: { prefix: newPrefix },
  });
}

/**
 * Reset a counter to a specific value.
 * DANGER: Only for admin corrections (e.g. start of year).
 * Creates an audit log entry.
 */
export async function resetCounter(
  tenantId: string,
  counterId: string,
  newValue: number,
  resetBy: string
) {
  const counter = await prisma.documentCounter.update({
    where: { id: counterId, tenantId },
    data: { currentNumber: newValue },
  });

  await prisma.documentNumberLog.create({
    data: {
      tenantId,
      documentType: counter.documentType,
      documentNumber: `RESET-${counter.documentType}-${counter.year}-to-${newValue}`,
      year: counter.year,
      sequence: newValue,
      generatedBy: resetBy,
      context: "admin:resetCounter",
    },
  });

  return counter;
}

/**
 * Get audit log entries for document numbers.
 */
export async function getNumberLogs(
  tenantId: string,
  opts?: { documentType?: string; limit?: number; offset?: number }
) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  return prisma.documentNumberLog.findMany({
    where: {
      tenantId,
      ...(opts?.documentType ? { documentType: opts.documentType } : {}),
    },
    orderBy: { generatedAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Ensure default counters exist for all document types for the current year.
 * Called during tenant setup / demo seed.
 */
export async function ensureDefaultCounters(tenantId: string) {
  const year = new Date().getFullYear();

  const existing = await prisma.documentCounter.findMany({
    where: { tenantId, year },
  });
  const existingTypes = new Set(existing.map((c) => c.documentType));

  const missing = ALL_DOCUMENT_TYPES.filter((t) => !existingTypes.has(t));
  if (missing.length === 0) return;

  await prisma.documentCounter.createMany({
    data: missing.map((type) => ({
      tenantId,
      documentType: type,
      year,
      currentNumber: 0,
      prefix: DEFAULT_PREFIXES[type],
    })),
  });
}
