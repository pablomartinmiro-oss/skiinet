export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/clientes/[id]/history
 *
 * Returns the full cross-module timeline for a Client:
 *  - quotes (with items count)
 *  - reservations
 *  - rentalOrders
 *  - groupCells (classes the client is in via OperationalUnit → Participant)
 *  - invoices
 *  - messages exchanged with the client's user (if linked)
 *
 * Items are matched on email + phone to be robust to clients that exist
 * outside the explicit Client table (legacy reservations).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const { id } = await params;

  try {
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const emailFilter = client.email
      ? [{ clientEmail: client.email }, { clientEmail: { equals: client.email, mode: "insensitive" as const } }]
      : [];
    const phoneFilter = client.phone ? [{ clientPhone: client.phone }] : [];
    const matchOR = [...emailFilter, ...phoneFilter];

    const [quotes, reservations, rentalOrders, invoices] = await Promise.all([
      matchOR.length > 0
        ? prisma.quote.findMany({
            where: { tenantId, OR: matchOR },
            select: {
              id: true,
              status: true,
              destination: true,
              checkIn: true,
              checkOut: true,
              totalAmount: true,
              createdAt: true,
              paidAt: true,
              _count: { select: { items: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      matchOR.length > 0
        ? prisma.reservation.findMany({
            where: { tenantId, OR: matchOR },
            select: {
              id: true,
              status: true,
              station: true,
              activityDate: true,
              schedule: true,
              totalPrice: true,
              source: true,
              createdAt: true,
            },
            orderBy: { activityDate: "desc" },
          })
        : Promise.resolve([]),
      matchOR.length > 0
        ? prisma.rentalOrder.findMany({
            where: { tenantId, OR: matchOR },
            select: {
              id: true,
              status: true,
              stationSlug: true,
              pickupDate: true,
              returnDate: true,
              totalPrice: true,
              _count: { select: { items: true } },
            },
            orderBy: { pickupDate: "desc" },
          })
        : Promise.resolve([]),
      prisma.invoice.findMany({
        where: { tenantId, clientId: id },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          issuedAt: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Group cells (classes) where the client is a participant on a reservation
    const reservationIds = reservations.map((r) => r.id);
    const classes = reservationIds.length
      ? await prisma.groupCell.findMany({
          where: {
            tenantId,
            units: { some: { reservationId: { in: reservationIds } } },
          },
          include: {
            instructor: { select: { user: { select: { name: true } } } },
            _count: { select: { units: true } },
          },
          orderBy: { activityDate: "desc" },
        })
      : [];

    // Messages — only when the Client is also a User (e.g. instructor staff)
    const linkedUser = client.email
      ? await prisma.user.findFirst({
          where: { tenantId, email: client.email },
          select: { id: true },
        })
      : null;

    const messages = linkedUser
      ? await prisma.message.findMany({
          where: {
            tenantId,
            OR: [{ fromUserId: linkedUser.id }, { toUserId: linkedUser.id }],
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } },
          },
        })
      : [];

    const totals = {
      quotes: quotes.length,
      reservations: reservations.length,
      rentalOrders: rentalOrders.length,
      classes: classes.length,
      invoices: invoices.length,
      messages: messages.length,
      lifetimeSpend: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0),
    };

    return NextResponse.json({
      client,
      totals,
      quotes,
      reservations,
      rentalOrders,
      classes,
      invoices,
      messages,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al cargar historial del cliente",
      code: "CLIENT_HISTORY_ERROR",
      logContext: { tenantId, clientId: id },
    });
  }
}
