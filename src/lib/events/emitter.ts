import { logger } from "@/lib/logger";

const log = logger.child({ module: "events/emitter" });

/**
 * In-process synchronous event bus for cross-module wiring.
 *
 * Why sync, in-process? Reliable: every emit happens inside the same request,
 * inside the same Postgres transaction (when callers want), and on failure
 * the parent can decide whether to roll back. Redis pub/sub would buy us
 * cross-instance fan-out we don't need yet, at the cost of harder error
 * propagation.
 *
 * Handlers should swallow their own errors unless the caller passes
 * `throwOnHandlerError`. emitEvent returns a Promise that resolves once
 * every handler has finished (Promise.allSettled semantics).
 */

export type EventType =
  | "reservation_confirmed"
  | "reservation_cancelled"
  | "rental_returned"
  | "class_completed"
  | "invoice_paid";

export interface EventPayloads {
  reservation_confirmed: { reservationId: string };
  reservation_cancelled: { reservationId: string; reason?: string };
  rental_returned: { rentalOrderId: string };
  class_completed: { groupCellId: string };
  invoice_paid: { invoiceId: string };
}

export interface EventEnvelope<T extends EventType = EventType> {
  tenantId: string;
  type: T;
  payload: EventPayloads[T];
  timestamp: Date;
}

type Handler<T extends EventType> = (
  ev: EventEnvelope<T>
) => void | Promise<void>;

// Use a generic-erased map internally — variance noise across union members
// would otherwise force every callsite into a cast.
type AnyHandler = (ev: EventEnvelope<EventType>) => void | Promise<void>;
const handlers = new Map<EventType, AnyHandler[]>();

export function on<T extends EventType>(type: T, handler: Handler<T>): () => void {
  let list = handlers.get(type);
  if (!list) {
    list = [];
    handlers.set(type, list);
  }
  list.push(handler as AnyHandler);
  return () => {
    const idx = list!.indexOf(handler as AnyHandler);
    if (idx >= 0) list!.splice(idx, 1);
  };
}

export async function emitEvent<T extends EventType>(
  tenantId: string,
  type: T,
  payload: EventPayloads[T],
  opts: { throwOnHandlerError?: boolean } = {}
): Promise<void> {
  const list = handlers.get(type) ?? [];
  const envelope: EventEnvelope<T> = {
    tenantId,
    type,
    payload,
    timestamp: new Date(),
  };

  log.info({ tenantId, type, handlerCount: list.length }, "Event emitted");

  const results = await Promise.allSettled(
    list.map((h) => h(envelope as EventEnvelope<EventType>))
  );
  const failures = results.filter((r) => r.status === "rejected");

  for (const f of failures) {
    log.error(
      { tenantId, type, error: (f as PromiseRejectedResult).reason },
      "Event handler failed"
    );
  }

  if (opts.throwOnHandlerError && failures.length > 0) {
    throw new Error(`${failures.length} event handler(s) failed for ${type}`);
  }
}
