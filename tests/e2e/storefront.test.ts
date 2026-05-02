import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * E2E storefront — Public storefront flow
 *
 * Verifies the cart→checkout→quote pipeline a customer hits when they buy
 * from the public store at /s/[slug]/*. Uses Prisma + Redis-cart mocks to
 * stay DB-less.
 *
 * Coverage:
 *   1. Listing public products by slug returns the right tenant scope
 *   2. Adding an item to cart creates a Redis cart with tenantId
 *   3. Checkout converts the cart into a Quote stamped with the tenant
 *   4. Checkout 404s when the slug is unknown (no leak)
 *   5. Checkout 404s when the cart belongs to a different tenant
 */

const TENANT_A = "tenant-skicenter-aaa";
const TENANT_B = "tenant-sierra-bbb";
const SLUG_A = "skicenter";

const mockTenant = {
  findUnique: vi.fn(),
};
const mockProduct = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
};
const mockQuote = {
  create: vi.fn(),
};
const mockDiscountCode = {
  findUnique: vi.fn(),
};

const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: mockTenant,
    product: mockProduct,
    quote: mockQuote,
    discountCode: mockDiscountCode,
    discountCodeUse: { create: vi.fn() },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

// Cart helpers — in-memory simulation
const cartStore = new Map<string, unknown>();
vi.mock("@/lib/storefront/cart", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storefront/cart")>(
    "@/lib/storefront/cart",
  );
  return {
    ...actual,
    getCart: vi.fn(async (id: string) => cartStore.get(id) ?? null),
    saveCart: vi.fn(async (cart: { id: string }) => {
      cartStore.set(cart.id, cart);
    }),
    deleteCart: vi.fn(async (id: string) => {
      cartStore.delete(id);
    }),
  };
});

// Redsys — simulate not-configured by default
vi.mock("@/lib/redsys/client", () => ({
  generateRedsysForm: vi.fn(() => {
    throw new Error("Redsys not configured");
  }),
  generateOrderId: vi.fn(() => "ORDER123"),
}));

describe("Storefront E2E — public flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartStore.clear();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 1. Public products listing — scoped to slug's tenant only
  // ───────────────────────────────────────────────────────────────────────
  it("GET /api/storefront/public/[slug]/products — scoped to slug's tenant", async () => {
    mockTenant.findUnique.mockResolvedValue({ id: TENANT_A });
    mockProduct.findMany.mockResolvedValue([
      { id: "p1", name: "Forfait Baqueira", slug: "forfait-baqueira", basePrice: 52 },
    ]);

    const { GET } = await import(
      "@/app/api/storefront/public/[slug]/products/route"
    );
    const res = await GET(
      new NextRequest("http://localhost/api/storefront/public/skicenter/products"),
      { params: Promise.resolve({ slug: SLUG_A }) },
    );

    expect(res.status).toBe(200);
    const where = mockProduct.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe(TENANT_A);
    expect(where.tenantId).not.toBe(TENANT_B);
  });

  it("GET /api/storefront/public/[slug]/products — unknown slug returns 404", async () => {
    mockTenant.findUnique.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/storefront/public/[slug]/products/route"
    );
    const res = await GET(
      new NextRequest("http://localhost/api/storefront/public/unknown/products"),
      { params: Promise.resolve({ slug: "unknown" }) },
    );

    expect(res.status).toBe(404);
    expect(mockProduct.findMany).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 2. Checkout — cart converts to Quote stamped with tenantId
  // ───────────────────────────────────────────────────────────────────────
  it("POST /api/storefront/[slug]/checkout — converts cart to Quote", async () => {
    mockTenant.findUnique.mockResolvedValue({
      id: TENANT_A,
      name: "Skicenter",
      slug: SLUG_A,
    });
    cartStore.set("cart-1", {
      id: "cart-1",
      tenantId: TENANT_A,
      items: [
        {
          id: "item-1",
          productId: "p1",
          productName: "Forfait Baqueira",
          quantity: 2,
          unitPrice: 52,
          totalPrice: 104,
          date: "2026-12-15",
        },
      ],
      subtotal: 104,
      total: 104,
      updatedAt: new Date().toISOString(),
    });
    mockQuote.create.mockResolvedValue({
      id: "q-new",
      tenantId: TENANT_A,
      totalAmount: 104,
      status: "nuevo",
      items: [],
    });

    const { POST } = await import(
      "@/app/api/storefront/[slug]/checkout/route"
    );
    const res = await POST(
      new NextRequest(`http://localhost/api/storefront/${SLUG_A}/checkout`, {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart-1",
          clientName: "Maria Test",
          clientEmail: "maria@test.com",
          clientPhone: "+34 600 000 000",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ slug: SLUG_A }) },
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.quoteId).toBe("q-new");
    // Falls back to manual when Redsys is not configured
    expect(json.paymentMode).toBe("manual");
    expect(json.redsys).toBeNull();

    expect(mockQuote.create).toHaveBeenCalledTimes(1);
    const data = mockQuote.create.mock.calls[0][0].data;
    expect(data.tenantId).toBe(TENANT_A);
    expect(data.clientName).toBe("Maria Test");
    expect(data.clientEmail).toBe("maria@test.com");
    expect(data.totalAmount).toBe(104);
    expect(data.source).toBe("storefront");
    expect(data.items.create).toHaveLength(1);
    expect(data.items.create[0].name).toBe("Forfait Baqueira");
    expect(data.items.create[0].totalPrice).toBe(104);

    // Cart consumed
    expect(cartStore.get("cart-1")).toBeUndefined();
  });

  it("POST /api/storefront/[slug]/checkout — unknown slug returns 404", async () => {
    mockTenant.findUnique.mockResolvedValue(null);

    const { POST } = await import(
      "@/app/api/storefront/[slug]/checkout/route"
    );
    const res = await POST(
      new NextRequest("http://localhost/api/storefront/unknown/checkout", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart-x",
          clientName: "X",
          clientEmail: "x@y.com",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ slug: "unknown" }) },
    );

    expect(res.status).toBe(404);
    expect(mockQuote.create).not.toHaveBeenCalled();
  });

  it("POST /api/storefront/[slug]/checkout — cart from another tenant returns 404", async () => {
    mockTenant.findUnique.mockResolvedValue({
      id: TENANT_A,
      name: "Skicenter",
      slug: SLUG_A,
    });
    // Cart belongs to tenant B but slug resolves to tenant A
    cartStore.set("cart-cross", {
      id: "cart-cross",
      tenantId: TENANT_B,
      items: [
        {
          id: "i",
          productId: "p1",
          productName: "Test",
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
        },
      ],
      subtotal: 10,
      total: 10,
      updatedAt: new Date().toISOString(),
    });

    const { POST } = await import(
      "@/app/api/storefront/[slug]/checkout/route"
    );
    const res = await POST(
      new NextRequest(`http://localhost/api/storefront/${SLUG_A}/checkout`, {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart-cross",
          clientName: "X",
          clientEmail: "x@y.com",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ slug: SLUG_A }) },
    );

    expect(res.status).toBe(404); // "Carrito no encontrado" from cross-tenant guard
    expect(mockQuote.create).not.toHaveBeenCalled();
  });
});
