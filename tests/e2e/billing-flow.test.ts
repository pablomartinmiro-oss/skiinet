import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * E2E billing flow — Quote → Conversion → Reservation → Auto-Invoice
 *
 * Verifies the end-to-end path that bills a tenant from a confirmed reservation:
 *   1. Quote→Reservation conversion creates the reservation, copies all line
 *      variables, and re-uses the existing reservation if the quote was already
 *      converted (idempotency).
 *   2. Patching a reservation to "confirmada" calls the auto-invoice helper
 *      with the correct payload + tenantId.
 *   3. autoInvoiceFromReservation generates a fiscal-grade Invoice (number
 *      from DocumentCounter, IVA-included → net+tax breakdown) and skips when
 *      the parent quote is already paid (the quote→invoice path owns billing).
 *
 * Uses Prisma + helper mocks (matching the existing __tests__ pattern) to
 * keep tests fast and DB-less.
 */

const TENANT = "tenant-billing-aaa";

// ─── Prisma mocks ────────────────────────────────────────────────────────
const mockReservation = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
const mockQuote = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
};
const mockInvoice = {
  findFirst: vi.fn(),
  create: vi.fn(),
};
const mockInvoiceLine = {
  createMany: vi.fn(),
};
const mockStationCapacity = {
  updateMany: vi.fn(),
};

const txClient = {
  reservation: mockReservation,
  quote: mockQuote,
  invoice: mockInvoice,
  invoiceLine: mockInvoiceLine,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    reservation: mockReservation,
    quote: mockQuote,
    invoice: mockInvoice,
    invoiceLine: mockInvoiceLine,
    stationCapacity: mockStationCapacity,
    $transaction: vi.fn(async (fn: (tx: typeof txClient) => unknown) => fn(txClient)),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

// Mock the document numbering helper (atomic counter)
vi.mock("@/lib/documents/numbering", () => ({
  generateDocumentNumber: vi.fn().mockResolvedValue("F-2026-0001"),
}));

// Mock invoice email — fire-and-forget, no real send
vi.mock("@/lib/finance/invoice-email", () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock heavy email/event modules so the PATCH route is testable
vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email/templates/reservation-confirmation", () => ({
  buildReservationConfirmationHTML: () => "<html></html>",
}));
vi.mock("@/lib/email/templates/reservation-cancellation", () => ({
  buildReservationCancellationHTML: () => "<html></html>",
}));
vi.mock("@/lib/events", () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/planning/operational-units", () => ({
  onReservationConfirmed: vi.fn().mockResolvedValue(undefined),
}));

// Spy on the auto-invoice helper to assert PATCH wires it up correctly
const mockAutoInvoice = vi.fn().mockResolvedValue({ id: "inv-1", number: "F-2026-0001" });
vi.mock("@/lib/invoices/auto-invoice-from-reservation", () => ({
  autoInvoiceFromReservation: (...args: unknown[]) => mockAutoInvoice(...args),
}));

function asTenant() {
  mockAuth.mockResolvedValue({
    user: {
      id: "owner-1",
      email: "owner@billing.test",
      tenantId: TENANT,
      roleName: "Owner / Manager",
      isDemo: false,
    },
  });
}

describe("Billing flow E2E — Quote → Reservation → Invoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asTenant();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 1. Quote→Reservation conversion
  // ───────────────────────────────────────────────────────────────────────
  it("converts a quote into a reservation, copying line variables", async () => {
    mockQuote.findFirst.mockResolvedValue({
      id: "q-1",
      tenantId: TENANT,
      status: "nuevo",
      clientName: "María García",
      clientEmail: "maria@test.com",
      clientPhone: "+34 600 000 000",
      destination: "baqueira_beret",
      checkIn: new Date("2026-12-15"),
      totalAmount: 450,
      ghlContactId: null,
      clientNotes: null,
      internalNotes: null,
      items: [
        {
          name: "Forfait 3 días",
          productId: "p-1",
          category: "forfait",
          description: null,
          quantity: 2,
          unitPrice: 90,
          discount: 0,
          totalPrice: 180,
          startDate: new Date("2026-12-15"),
          endDate: new Date("2026-12-17"),
          numDays: 3,
          numPersons: 2,
          ageDetails: null,
          station: "baqueira_beret",
          modalidad: null,
          nivel: null,
          sector: null,
          idioma: null,
          horario: "09:00-17:00",
          puntoEncuentro: null,
          tipoCliente: null,
          gama: null,
          casco: null,
          tipoActividad: null,
          regimen: null,
          alojamientoNombre: null,
          seguroIncluido: null,
          tallaBotas: null,
          alturaPeso: null,
          dni: null,
          notes: null,
        },
      ],
    });
    mockReservation.findFirst.mockResolvedValue(null); // No existing reservation
    mockReservation.create.mockResolvedValue({ id: "res-1", tenantId: TENANT, status: "pendiente" });
    mockQuote.update.mockResolvedValue({ id: "q-1", status: "en_proceso" });

    const { POST } = await import(
      "@/app/api/reservations/from-quote/[quoteId]/route"
    );
    const res = await POST(
      new NextRequest("http://localhost/api/reservations/from-quote/q-1", {
        method: "POST",
      }),
      { params: Promise.resolve({ quoteId: "q-1" }) },
    );

    expect(res.status).toBe(201);
    expect(mockReservation.create).toHaveBeenCalledTimes(1);
    const data = mockReservation.create.mock.calls[0][0].data;
    expect(data.tenantId).toBe(TENANT);
    expect(data.quoteId).toBe("q-1");
    expect(data.station).toBe("baqueira_beret");
    expect(data.schedule).toBe("09:00-17:00"); // Picked from item, not the default
    expect(data.totalPrice).toBe(450);
    // Quote moved to en_proceso
    expect(mockQuote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "q-1" },
        data: expect.objectContaining({ status: "en_proceso" }),
      }),
    );
  });

  it("is idempotent — returns existing reservation if the quote was already converted", async () => {
    mockQuote.findFirst.mockResolvedValue({
      id: "q-1",
      tenantId: TENANT,
      status: "en_proceso",
      clientName: "Maria",
      clientEmail: "m@test.com",
      clientPhone: "",
      destination: "baqueira",
      checkIn: new Date(),
      totalAmount: 100,
      ghlContactId: null,
      clientNotes: null,
      internalNotes: null,
      items: [],
    });
    mockReservation.findFirst.mockResolvedValue({ id: "res-existing", tenantId: TENANT });

    const { POST } = await import(
      "@/app/api/reservations/from-quote/[quoteId]/route"
    );
    const res = await POST(
      new NextRequest("http://localhost/api/reservations/from-quote/q-1", { method: "POST" }),
      { params: Promise.resolve({ quoteId: "q-1" }) },
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.existing).toBe(true);
    expect(json.reservation.id).toBe("res-existing");
    expect(mockReservation.create).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 2. PATCH reservation → confirmada triggers auto-invoice
  // ───────────────────────────────────────────────────────────────────────
  it("PATCH status=confirmada calls autoInvoiceFromReservation with tenantId", async () => {
    const existing = {
      id: "res-2",
      tenantId: TENANT,
      status: "pendiente",
      station: "sierra_nevada",
      activityDate: new Date("2026-12-20"),
      clientName: "Carlos",
      clientEmail: "carlos@test.com",
      schedule: "10:00-13:00",
      totalPrice: 200,
      discount: 0,
      services: [{ type: "forfait", quantity: 1, totalPrice: 200 }],
      participants: [],
    };
    mockReservation.findFirst.mockResolvedValue(existing);
    mockReservation.update.mockResolvedValue({
      ...existing,
      status: "confirmada",
    });

    const { PATCH } = await import("@/app/api/reservations/[id]/route");
    await PATCH(
      new NextRequest("http://localhost/api/reservations/res-2", {
        method: "PATCH",
        body: JSON.stringify({ status: "confirmada" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "res-2" }) },
    );

    // Allow the fire-and-forget chain to run
    await new Promise((r) => setTimeout(r, 0));

    expect(mockAutoInvoice).toHaveBeenCalledTimes(1);
    const [reservationArg, tenantIdArg] = mockAutoInvoice.mock.calls[0];
    expect(tenantIdArg).toBe(TENANT);
    expect(reservationArg.id).toBe("res-2");
    expect(reservationArg.totalPrice).toBe(200);
    expect(reservationArg.station).toBe("sierra_nevada");
  });

  // ───────────────────────────────────────────────────────────────────────
  // 3. autoInvoiceFromReservation creates a fiscal-grade Invoice
  // ───────────────────────────────────────────────────────────────────────
  it("autoInvoiceFromReservation creates Invoice with correct IVA breakdown", async () => {
    mockInvoice.findFirst.mockResolvedValue(null); // no existing
    mockReservation.findUnique.mockResolvedValue({ quoteId: null, clientEmail: "c@test.com" });
    mockInvoice.create.mockImplementation(async ({ data }) => ({
      id: "inv-x",
      number: data.number,
      ...data,
    }));
    mockInvoiceLine.createMany.mockResolvedValue({ count: 1 });

    const { autoInvoiceFromReservation } = await import(
      "@/lib/invoices/auto-invoice-from-reservation"
    );
    const result = await autoInvoiceFromReservation(
      {
        id: "res-3",
        clientName: "Ana",
        clientEmail: "ana@test.com",
        totalPrice: 121, // gross with IVA included → net 100, tax 21
        discount: 0,
        station: "baqueira",
        activityDate: new Date("2026-12-22"),
        services: [],
        participants: [],
      },
      TENANT,
    );

    expect(result).not.toBeNull();
    expect(result?.number).toBe("F-2026-0001");

    const createCall = mockInvoice.create.mock.calls[0][0].data;
    // Subtotal = 121 / 1.21 = 100, tax = 21, total = 121
    expect(createCall.subtotal).toBe(100);
    expect(createCall.taxAmount).toBe(21);
    expect(createCall.total).toBe(121);
    expect(createCall.tenantId).toBe(TENANT);
    expect(createCall.reservationId).toBe("res-3");
    expect(createCall.status).toBe("sent");
  });

  it("autoInvoiceFromReservation skips when the source quote is already paid", async () => {
    mockInvoice.findFirst.mockResolvedValue(null);
    // Reservation came from a paid quote → quote→invoice path owns billing
    mockReservation.findUnique.mockResolvedValue({
      quoteId: "q-paid",
      clientEmail: "c@test.com",
    });
    mockQuote.findUnique.mockResolvedValue({
      paymentStatus: "paid",
      status: "pagado",
    });

    const { autoInvoiceFromReservation } = await import(
      "@/lib/invoices/auto-invoice-from-reservation"
    );
    const result = await autoInvoiceFromReservation(
      {
        id: "res-4",
        clientName: "Test",
        clientEmail: "t@test.com",
        totalPrice: 100,
        discount: 0,
        station: "baqueira",
        activityDate: new Date(),
        services: [],
        participants: [],
      },
      TENANT,
    );

    expect(result).toBeNull();
    expect(mockInvoice.create).not.toHaveBeenCalled();
  });

  it("autoInvoiceFromReservation is idempotent — returns existing invoice", async () => {
    mockInvoice.findFirst.mockResolvedValue({ id: "inv-already", number: "F-2026-0099" });

    const { autoInvoiceFromReservation } = await import(
      "@/lib/invoices/auto-invoice-from-reservation"
    );
    const result = await autoInvoiceFromReservation(
      {
        id: "res-5",
        clientName: "Test",
        clientEmail: "t@test.com",
        totalPrice: 100,
        discount: 0,
        station: "baqueira",
        activityDate: new Date(),
        services: [],
        participants: [],
      },
      TENANT,
    );

    expect(result).toEqual({ id: "inv-already", number: "F-2026-0099" });
    expect(mockInvoice.create).not.toHaveBeenCalled();
  });
});
