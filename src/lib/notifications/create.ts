import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "notifications/create" });

interface CreateNotificationOpts {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

/**
 * Create an in-app notification for a user.
 * Fire-and-forget: callers should `.catch()` to avoid breaking the parent op.
 */
export async function createNotification(
  opts: CreateNotificationOpts
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body ?? null,
        data: opts.data ? JSON.parse(JSON.stringify(opts.data)) : undefined,
      },
    });
  } catch (err) {
    log.error({ err, ...opts }, "Failed to create notification");
  }
}
