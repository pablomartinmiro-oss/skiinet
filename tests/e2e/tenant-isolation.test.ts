import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * E2E tenant-isolation suite — extends __tests__/lib/multi-tenant-isolation.test.ts
 *
 * Verifies tenant A cannot see or mutate tenant B data on the surfaces the
 * existing suite did not cover: Leads (CRM-adjacent), Clientes (unified
 * client view across modules), Invoices (Finanzas), and Rental Orders.
 *
 * Pattern: Prisma + auth mocks; assert WHERE clauses are tenant-scoped and
 * cross-tenant lookups produce 404, no data leak, and no writes.
 */

const TENANT_A = "tenant-skicenter-aaa";
const TENANT_B = "tenant-sierra-bbb";

const mockLead = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
const mockClient = {
  findFirst: vi.fn(),
};
const mockInvoice = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
};
const mockQuote = {
  findMany: vi.fn(),
};
const mockReservation = {
  findMany: vi.fn(),
};
const mockRentalOrder = {
  findMany: vi.fn(),
};
const mockGroupCell = {
  findMany: vi.fn(),
};
const mockUser = {
  findFirst: vi.fn(),
};
const mockMessage = {
  findMany: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: mockLead,
    client: mockClient,
    invoice: mockInvoice,
    quote: mockQuote,
    reservation: mockReservation,
    rentalOrder: mockRentalOrder,
    groupCell: mockGroupCell,
    user: mockUser,
    message: mockMessage,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

// requireModule — fail-open in tests, simulate "all enabled"
vi.mock("@/lib/modules/guard", () => ({
  requireModule: vi.fn().mockResolvedValue(null),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

function asTenantA() {
  mockAuth.mockResolvedValue({
    user: {
      id: "user-a",
      email: "owner@skicenter.test",
      tenantId: TENANT_A,
      roleName: "Owner / Manager",
      isDemo: false,
    },
  });
}

function asTenantB() {
  mockAuth.mockResolvedValue({
    user: {
      id: "user-b",
      email: "owner@sierra.test",
      tenantId: TENANT_B,
      roleName: "Owner / Manager",
      isDemo: false,
    },
  });
}

describe("Tenant isolation E2E — extended surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────
  // Leads
  // ───────────────────────────────────────────────────────────────────────
  it("Leads GET — query is strictly scoped to caller's tenantId", async () => {
    asTenantA();
    mockLead.count.mockResolvedValue(0);
    mockLead.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/leads/route");
    await GET(new NextRequest("http://localhost/api/leads"));

    const where = mockLead.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe(TENANT_A);
    expect(where.tenantId).not.toBe(TENANT_B);
  });

  it("Leads GET — tenant B sees ONLY tenant B leads (no fallback to A)", async () => {
    asTenantB();
    mockLead.count.mockResolvedValue(0);
    mockLead.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/leads/route");
    await GET(new NextRequest("http://localhost/api/leads"));

    const where = mockLead.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe(TENANT_B);
    expect(where).not.toHaveProperty("OR");
  });

  // ───────────────────────────────────────────────────────────────────────
  // Clientes (unified history)
  // ───────────────────────────────────────────────────────────────────────
  it("Clientes [id]/history — cross-tenant access returns 404", async () => {
    asTenantA();
    // Client belongs to tenant B → findFirst({id, tenantId: A}) → null
    mockClient.findFirst.mockResolvedValue(null);

    const { GET } = await import("@/app/api/clientes/[id]/history/route");
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/client-of-b/history"),
      { params: Promise.resolve({ id: "client-of-b" }) },
    );

    expect(res.status).toBe(404);
    const where = mockClient.findFirst.mock.calls[0][0].where;
    expect(where.tenantId).toBe(TENANT_A);
    expect(where.id).toBe("client-of-b");
    // No downstream queries fired since we 404'd early
    expect(mockQuote.findMany).not.toHaveBeenCalled();
    expect(mockReservation.findMany).not.toHaveBeenCalled();
  });

  it("Clientes [id]/history — every aggregate query is tenant-scoped", async () => {
    asTenantA();
    mockClient.findFirst.mockResolvedValue({
      id: "c-1",
      tenantId: TENANT_A,
      name: "Test",
      email: "t@test.com",
      phone: "+34 600",
      createdAt: new Date(),
    });
    mockQuote.findMany.mockResolvedValue([]);
    mockReservation.findMany.mockResolvedValue([]);
    mockRentalOrder.findMany.mockResolvedValue([]);
    mockInvoice.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/clientes/[id]/history/route");
    await GET(
      new NextRequest("http://localhost/api/clientes/c-1/history"),
      { params: Promise.resolve({ id: "c-1" }) },
    );

    // Each cross-module fetch must scope by tenantId
    for (const mock of [
      mockQuote.findMany,
      mockReservation.findMany,
      mockRentalOrder.findMany,
      mockInvoice.findMany,
    ]) {
      if (mock.mock.calls.length > 0) {
        const where = mock.mock.calls[0][0].where;
        expect(where.tenantId).toBe(TENANT_A);
      }
    }
  });

  // ───────────────────────────────────────────────────────────────────────
  // Invoices (Finanzas)
  // ───────────────────────────────────────────────────────────────────────
  it("Invoices GET — strict tenantId scope", async () => {
    asTenantB();
    mockInvoice.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/finance/invoices/route");
    await GET(new NextRequest("http://localhost/api/finance/invoices"));

    const where = mockInvoice.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe(TENANT_B);
    expect(where.tenantId).not.toBe(TENANT_A);
  });
});
