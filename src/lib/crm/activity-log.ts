import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma/client";

const log = logger.child({ module: "crm/activity-log" });

export type CrmEntityType = "lead" | "quote" | "reservation" | "invoice" | "payment";

export type CrmAction =
  | "created"
  | "updated"
  | "status_changed"
  | "email_sent"
  | "payment_received"
  | "payment_failed"
  | "tampering_suspected"
  | "note_added"
  | "assigned"
  | "converted"
  | "lost"
  | "linked";

export type CrmActivityInput = {
  tenantId: string;
  entityType: CrmEntityType;
  entityId: string;
  action: CrmAction;
  /** userId of the human actor; omit for system-triggered events. */
  actorId?: string | null;
  actorName?: string | null;
  /** Free-form structured payload — old/new values, amount, note text, etc. */
  details?: Prisma.InputJsonValue | null;
};

/**
 * Append a CRM activity row. Best-effort: never throws to caller — a
 * missing audit log entry should not abort the surrounding operation
 * (creating a quote, processing a payment, etc.).
 *
 * Returns the new row id when successful, null on failure.
 */
export async function logCrmActivity(input: CrmActivityInput): Promise<string | null> {
  try {
    const row = await prisma.crmActivityLog.create({
      data: {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        details: input.details ?? Prisma.JsonNull,
      },
      select: { id: true },
    });
    return row.id;
  } catch (err) {
    log.warn(
      {
        err,
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
      },
      "Failed to write CRM activity log",
    );
    return null;
  }
}

/**
 * Fire-and-forget version. Returns void and never blocks the caller.
 * Useful inside webhooks/cron where logging should not delay the response.
 */
export function logCrmActivityAsync(input: CrmActivityInput): void {
  logCrmActivity(input).catch(() => {
    /* already logged inside logCrmActivity */
  });
}

/**
 * Fetch the activity timeline for one entity, newest first.
 */
export async function getEntityTimeline(
  tenantId: string,
  entityType: CrmEntityType,
  entityId: string,
  limit = 50,
) {
  return prisma.crmActivityLog.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
