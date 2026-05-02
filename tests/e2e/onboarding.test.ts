import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * E2E onboarding — new tenant registration via /api/auth/register
 *
 * Verifies the wizard's first step (creating an account) does the right
 * thing on the server: a Tenant + 4 default Roles + Owner User are created
 * inside a transaction, ALL 17 modules are enabled by default in
 * ModuleConfig, and the response redirects the new user into the wizard
 * for the remaining steps. Also covers the email-already-taken error path.
 */

// Module registry needs to resolve before route imports
vi.mock("@/lib/modules/registry", () => ({
  ALL_MODULE_SLUGS: [
    "core",
    "crm",
    "catalog",
    "booking",
    "hotel",
    "spa",
    "rental",
    "restaurant",
    "finance",
    "suppliers",
    "reav",
    "tpv",
    "storefront",
    "cms",
    "ticketing",
    "reviews",
    "packs",
  ],
}));

// ─── Prisma mocks ────────────────────────────────────────────────────────
const mockTenant = {
  create: vi.fn(),
  findUnique: vi.fn().mockResolvedValue(null),
};
const mockUser = {
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
const mockRole = {
  create: vi.fn(),
  createMany: vi.fn(),
  findFirst: vi.fn(),
};
const mockModuleConfig = {
  createMany: vi.fn(),
};

const txClient = {
  tenant: mockTenant,
  user: mockUser,
  role: mockRole,
  moduleConfig: mockModuleConfig,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: mockTenant,
    user: mockUser,
    role: mockRole,
    moduleConfig: mockModuleConfig,
    $transaction: vi.fn(async (fn: (tx: typeof txClient) => unknown) => fn(txClient)),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  getClientIP: () => "127.0.0.1",
}));

vi.mock("@/lib/email/resend", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email/templates/welcome-tenant", () => ({
  buildWelcomeTenantHTML: () => "<html></html>",
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

describe("Onboarding — POST /api/auth/register (new tenant flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenant.findUnique.mockResolvedValue(null);
    mockUser.findFirst.mockResolvedValue(null);
    mockTenant.create.mockResolvedValue({
      id: "tenant-new",
      name: "Sierra Ski Test",
      slug: "sierra-ski-test",
    });
    mockRole.create.mockResolvedValue({
      id: "role-owner",
      name: "Owner / Manager",
    });
    mockRole.createMany.mockResolvedValue({ count: 3 });
    mockUser.create.mockResolvedValue({
      id: "user-1",
      email: "owner@sierra.test",
    });
    mockModuleConfig.createMany.mockResolvedValue({ count: 17 });
  });

  it("creates tenant + Owner role + user + enables all 17 modules", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "Owner@Sierra.Test",
          password: "SecurePass123",
          name: "Sierra Owner",
          companyName: "Sierra Ski Test",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    // Wizard kicks off at /onboarding after the first step
    expect(json.redirect).toBe("/onboarding");

    // Tenant created with onboarding still pending
    expect(mockTenant.create).toHaveBeenCalledTimes(1);
    const tenantData = mockTenant.create.mock.calls[0][0].data;
    expect(tenantData.name).toBe("Sierra Ski Test");
    expect(tenantData.onboardingComplete).toBe(false);
    expect(tenantData.slug).toMatch(/^sierra-ski-test/);

    // Owner role created
    expect(mockRole.create).toHaveBeenCalledTimes(1);
    expect(mockRole.create.mock.calls[0][0].data.name).toBe("Owner / Manager");

    // 3 additional default roles
    expect(mockRole.createMany).toHaveBeenCalledTimes(1);
    const otherRoles = mockRole.createMany.mock.calls[0][0].data.map(
      (r: { name: string }) => r.name,
    );
    expect(otherRoles).toEqual(
      expect.arrayContaining(["Sales Rep", "Marketing", "VA / Admin"]),
    );

    // Email lowercased + linked to tenant + Owner role
    expect(mockUser.create).toHaveBeenCalledTimes(1);
    const userData = mockUser.create.mock.calls[0][0].data;
    expect(userData.email).toBe("owner@sierra.test");
    expect(userData.tenantId).toBe("tenant-new");
    expect(userData.roleId).toBe("role-owner");
    expect(userData.passwordHash).toBe("hashed-password");

    // ALL modules enabled by default — non-negotiable for new tenants
    expect(mockModuleConfig.createMany).toHaveBeenCalledTimes(1);
    const moduleData = mockModuleConfig.createMany.mock.calls[0][0].data;
    expect(moduleData.length).toBe(17);
    const slugs = moduleData.map((m: { module: string }) => m.module);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "core",
        "crm",
        "catalog",
        "booking",
        "hotel",
        "spa",
        "rental",
        "restaurant",
        "finance",
        "suppliers",
        "reav",
        "tpv",
        "storefront",
        "cms",
        "ticketing",
        "reviews",
        "packs",
      ]),
    );
    expect(moduleData.every((m: { isEnabled: boolean; tenantId: string }) =>
      m.isEnabled === true && m.tenantId === "tenant-new"
    )).toBe(true);
  });

  it("rejects when companyName missing on new-tenant flow", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "x@y.test",
          password: "SecurePass123",
          name: "X",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
    expect(mockTenant.create).not.toHaveBeenCalled();
  });

  it("rejects when email already exists", async () => {
    mockUser.findFirst.mockResolvedValue({ id: "existing", email: "owner@sierra.test" });
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "owner@sierra.test",
          password: "SecurePass123",
          name: "Owner",
          companyName: "Sierra",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toMatch(/registrado/i);
    expect(mockTenant.create).not.toHaveBeenCalled();
  });

  it("rejects weak passwords (Zod validation)", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "weak@test.com",
          password: "weak",
          name: "W",
          companyName: "Weak",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
    expect(mockTenant.create).not.toHaveBeenCalled();
  });
});
