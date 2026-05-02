import { logger } from "@/lib/logger";
import { on } from "./emitter";
import { cascadeOnConfirm, cascadeOnCancel } from "@/lib/reservations/cascade";
import { createNotification } from "@/lib/notifications/create";
import { prisma } from "@/lib/db";

const log = logger.child({ module: "events/handlers" });

let registered = false;

/**
 * Register all cross-module event handlers exactly once per process. Imported
 * for side-effect by `lib/events/index.ts`; safe to call multiple times.
 */
export function registerEventHandlers(): void {
  if (registered) return;
  registered = true;

  // ============== reservation_confirmed ==============
  on("reservation_confirmed", async (ev) => {
    const { reservationId } = ev.payload;
    const result = await cascadeOnConfirm(ev.tenantId, reservationId);
    log.info(
      {
        tenantId: ev.tenantId,
        reservationId,
        rentalOrders: result.rentalOrders.length,
        lodgeStays: result.lodgeStays.length,
        activityBookings: result.activityBookings.length,
      },
      "Cascade on confirm completed"
    );

    // Notify owners/managers when class items need a monitor
    if (result.activityBookings.length > 0) {
      const owners = await prisma.user.findMany({
        where: {
          tenantId: ev.tenantId,
          role: { name: { in: ["Owner", "Manager"] } },
        },
        select: { id: true },
      });
      await Promise.all(
        owners.map((o) =>
          createNotification({
            tenantId: ev.tenantId,
            userId: o.id,
            type: "horario_cambio",
            title: "Clase pendiente de asignar",
            body: `Una reserva confirmada tiene clases sin monitor asignado.`,
            data: { reservationId, activityBookingIds: result.activityBookings.map((b) => b.id) },
          })
        )
      );
    }
  });

  // ============== reservation_cancelled ==============
  on("reservation_cancelled", async (ev) => {
    const { reservationId } = ev.payload;
    const result = await cascadeOnCancel(ev.tenantId, reservationId);
    log.info(
      { tenantId: ev.tenantId, reservationId, ...result },
      "Cascade on cancel completed"
    );
  });

  // ============== rental_returned ==============
  on("rental_returned", async (ev) => {
    log.info(
      { tenantId: ev.tenantId, rentalOrderId: ev.payload.rentalOrderId },
      "rental_returned — nothing to fan out yet"
    );
  });

  // ============== class_completed ==============
  on("class_completed", async (ev) => {
    log.info(
      { tenantId: ev.tenantId, groupCellId: ev.payload.groupCellId },
      "class_completed — nothing to fan out yet"
    );
  });

  // ============== invoice_paid ==============
  on("invoice_paid", async (ev) => {
    log.info(
      { tenantId: ev.tenantId, invoiceId: ev.payload.invoiceId },
      "invoice_paid — nothing to fan out yet"
    );
  });
}
