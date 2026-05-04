export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/comms/conversations
 *
 * Inbox listing. Query params:
 *   - status: "open" | "snoozed" | "closed" (default: "open")
 *   - channel: filter by sms|whatsapp|email|voice
 *   - assignedTo: userId
 *   - search: substring match on lastMessageBody / channelRef
 *   - limit: default 50, max 200
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const url = request.nextUrl;
  const status = url.searchParams.get("status") ?? "open";
  const channel = url.searchParams.get("channel");
  const assignedTo = url.searchParams.get("assignedTo");
  const search = url.searchParams.get("search");
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50)) : 50;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId,
        status,
        ...(channel ? { channel } : {}),
        ...(assignedTo ? { assignedTo } : {}),
        ...(search
          ? {
              OR: [
                { lastMessageBody: { contains: search, mode: "insensitive" as const } },
                { channelRef: { contains: search } },
                { subject: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { lastMessageAt: "desc" },
      take: limit,
      include: {
        lead: { select: { id: true, name: true, email: true, status: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo cargar el inbox",
      code: "COMMS_LIST_ERROR",
      logContext: { tenantId },
    });
  }
}
