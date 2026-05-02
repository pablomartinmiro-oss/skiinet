import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for autoInvoiceFromReservation
 *
 * Sibling of tests/e2e/billing-flow.test.ts: that file mocks the helper
 * to assert the PATCH route wiring, while this file imports the real
 * helper to verify its internal behavior.
 *
 * Coverage:
 *   1. Idempotency — returns the existing invoice when one is already
 *      attached to the reservation, never re-creates.
 *   2. Skips when the source quote is already paid (the quote→invoice
 *      path owns billing in that case).
 *   3. Generates a fiscal-grade invoice: subtotal = gross / 1.21,
 *      taxAmount = gross − subtotal, total = gross.
 */

const TENANT = "tenant-billing-aaa";

const mockReservation = { findUnique: vi.fn() };
const mockQuote = { findUnique: vi.fn() };
const mockInvoice = { findFirst: vi.fn(), create: vi.fn() };
const mockInvoiceLine = { createMany: vi.fn() };

const txClient = {
  invoice: mockInvoice,
  invoiceLine: mockInvoiceLine,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    reservation: mockReservation,
    quote: mockQuote,
    invoice: mockInvoice,
    invoiceLine: mockInvoiceLine,
    $transaction: vi.fn(async (fn: (tx: typeof txClient) => unknown) => fn(txClient)),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

vi.mock("@/lib/documents/numbering", () => ({
  generateDocumentNumber: vi.fn().mockResolvedValue("F-2026-0001"),
}));

vi.mock("@/lib/finance/invoice-email", () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("autoInvoiceFromReservation — helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates Invoice with correct IVA breakdown (gross is IVA-included)", async () => {
    mockInvoice.findFirst.mockResolvedValue(null);
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

    expect(mockInvoice.create).toHaveBeenCalledTimes(1);
    const data = mockInvoice.create.mock.calls[0][0].data;
    expect(data.subtotal).toBe(100);
    expect(data.taxAmount).toBe(21);
    expect(data.total).toBe(121);
    expect(data.tenantId).toBe(TENANT);
    expect(data.reservationId).toBe("res-3");
    expect(data.status).toBe("sent");
  });

  it("skips when the source quote is already paid (quote→invoice owns billing)", async () => {
    mockInvoice.findFirst.mockResolvedValue(null);
    mockReservation.findUnique.mockResolvedValue({ quoteId: "q-paid", clientEmail: "c@test.com" });
    mockQuote.findUnique.mockResolvedValue({ paymentStatus: "paid", status: "pagado" });

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

  it("is idempotent — returns existing invoice if already created", async () => {
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
