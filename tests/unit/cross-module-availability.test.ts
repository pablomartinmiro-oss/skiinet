import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for checkCrossModuleAvailability
 *
 * The function fans out per-item availability across rental, hotel, class,
 * and instructor modules in parallel. Each item type is checked against
 * its own backing tables, and the aggregate result.ok is true only if
 * every item passes.
 *
 * These tests assert the multi-module quote scenario from Phase 5: a quote
 * mixing rental + hotel + class needs ALL three modules to have capacity
 * for the function to return ok=true. Failure in any module surfaces a
 * Spanish reason and the worst-case "available" count.
 */

const mockProduct = { findFirst: vi.fn() };
const mockStationCapacity = { findFirst: vi.fn() };
const mockRentalInventory = { findFirst: vi.fn() };
const mockRentalOrder = { findMany: vi.fn() };
const mockRoomType = { findFirst: vi.fn() };
const mockLodgeStay = { count: vi.fn() };
const mockRoomBlock = { aggregate: vi.fn() };
const mockInstructor = { count: vi.fn() };

vi.mock("@/lib/db", () => ({
  prisma: {
    product: mockProduct,
    stationCapacity: mockStationCapacity,
    rentalInventory: mockRentalInventory,
    rentalOrder: mockRentalOrder,
    roomType: mockRoomType,
    lodgeStay: mockLodgeStay,
    roomBlock: mockRoomBlock,
    instructor: mockInstructor,
  },
}));

const TENANT = "tenant-cross-aaa";

describe("checkCrossModuleAvailability — multi-module quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rental + hotel + class all OK → result.ok is true", async () => {
    // Rental: 5 skis available, 0 overlapping orders
    mockRentalInventory.findFirst.mockResolvedValue({
      availableQuantity: 5,
      totalQuantity: 5,
      condition: "ok",
      equipmentType: "ski",
      size: "170",
      qualityTier: "gold",
      stationSlug: "baqueira",
    });
    mockRentalOrder.findMany.mockResolvedValue([]);

    // Hotel: 3 rooms total, 1 stay overlapping, 0 blocks
    mockRoomType.findFirst.mockResolvedValue({
      id: "rt-1",
      title: "Doble",
      capacity: 3,
      active: true,
    });
    mockLodgeStay.count.mockResolvedValue(1);
    mockRoomBlock.aggregate.mockResolvedValue({ _sum: { unitCount: 0 } });

    // Class: 10/10 capacity, 4 booked → 6 remaining, requesting 2
    mockProduct.findFirst.mockResolvedValue({
      category: "escuela",
      station: "baqueira",
      name: "Cursillo niños",
    });
    mockStationCapacity.findFirst.mockResolvedValue({
      maxCapacity: 10,
      booked: 4,
    });

    const { checkCrossModuleAvailability } = await import(
      "@/lib/availability/cross-module"
    );
    const result = await checkCrossModuleAvailability(
      TENANT,
      new Date("2026-12-20"),
      [
        { type: "rental", inventoryId: "inv-1", qty: 2 },
        { type: "hotel", roomTypeId: "rt-1", nights: 2, units: 1 },
        { type: "class", productId: "p-1", qty: 2 },
      ],
    );

    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(result.items.every((i) => i.ok)).toBe(true);
    expect(result.items[0].available).toBe(5); // rental
    expect(result.items[1].available).toBe(2); // hotel: 3 total - 1 stay - 0 blocks
    expect(result.items[2].available).toBe(6); // class: 10 - 4
    expect(result.date).toBe("2026-12-20");
  });

  it("rental shortage flips overall ok to false; other modules still report status", async () => {
    // Rental: only 1 unit available, requesting 3 → fail
    mockRentalInventory.findFirst.mockResolvedValue({
      availableQuantity: 1,
      totalQuantity: 5,
      condition: "ok",
      equipmentType: "snowboard",
      size: "150",
      qualityTier: "silver",
      stationSlug: "baqueira",
    });
    mockRentalOrder.findMany.mockResolvedValue([]);

    // Hotel: plenty of rooms
    mockRoomType.findFirst.mockResolvedValue({
      id: "rt-2",
      title: "Suite",
      capacity: 5,
      active: true,
    });
    mockLodgeStay.count.mockResolvedValue(0);
    mockRoomBlock.aggregate.mockResolvedValue({ _sum: { unitCount: 0 } });

    // Class: no capacity row → unrestricted
    mockProduct.findFirst.mockResolvedValue({
      category: "clase_particular",
      station: "baqueira",
      name: "Privada 1h",
    });
    mockStationCapacity.findFirst.mockResolvedValue(null);

    const { checkCrossModuleAvailability } = await import(
      "@/lib/availability/cross-module"
    );
    const result = await checkCrossModuleAvailability(
      TENANT,
      new Date("2026-12-21"),
      [
        { type: "rental", inventoryId: "inv-2", qty: 3 },
        { type: "hotel", roomTypeId: "rt-2", nights: 1 },
        { type: "class", productId: "p-2", qty: 1 },
      ],
    );

    expect(result.ok).toBe(false);
    const rentalSlot = result.items[0];
    expect(rentalSlot.ok).toBe(false);
    expect(rentalSlot.available).toBe(1);
    expect(rentalSlot.reason).toMatch(/snowboard/i);

    expect(result.items[1].ok).toBe(true); // hotel
    expect(result.items[2].ok).toBe(true); // class (unrestricted)
  });

  it("hotel block reduces availability; reports Spanish reason", async () => {
    // Hotel: 2 total, 0 stays, but a 2-unit block on the date → 0 available
    mockRoomType.findFirst.mockResolvedValue({
      id: "rt-3",
      title: "Familiar",
      capacity: 2,
      active: true,
    });
    mockLodgeStay.count.mockResolvedValue(0);
    mockRoomBlock.aggregate.mockResolvedValue({ _sum: { unitCount: 2 } });

    const { checkCrossModuleAvailability } = await import(
      "@/lib/availability/cross-module"
    );
    const result = await checkCrossModuleAvailability(
      TENANT,
      new Date("2026-12-22"),
      [{ type: "hotel", roomTypeId: "rt-3", nights: 1, units: 1 }],
    );

    expect(result.ok).toBe(false);
    expect(result.items[0].ok).toBe(false);
    expect(result.items[0].available).toBe(0);
    expect(result.items[0].reason).toMatch(/Familiar/);
  });

  it("class shortage probes next 14 days for nextAvailableDate", async () => {
    mockProduct.findFirst.mockResolvedValue({
      category: "escuela",
      station: "baqueira",
      name: "Grupo niños",
    });
    // Day 0: full
    mockStationCapacity.findFirst
      .mockResolvedValueOnce({ maxCapacity: 5, booked: 5 })
      // Probe day +1: also full
      .mockResolvedValueOnce({ maxCapacity: 5, booked: 5 })
      // Probe day +2: free
      .mockResolvedValueOnce({ maxCapacity: 5, booked: 0 });

    const { checkCrossModuleAvailability } = await import(
      "@/lib/availability/cross-module"
    );
    const result = await checkCrossModuleAvailability(
      TENANT,
      new Date("2026-12-23"),
      [{ type: "class", productId: "p-3", qty: 2 }],
    );

    expect(result.ok).toBe(false);
    expect(result.items[0].available).toBe(0);
    expect(result.items[0].nextAvailableDate).toBe("2026-12-25");
  });

  it("instructor shortage when level filter excludes available staff", async () => {
    // 2 instructors total, 1 already busy → only 1 available, need 2
    mockInstructor.count
      .mockResolvedValueOnce(2) // total eligible
      .mockResolvedValueOnce(1); // busy

    const { checkCrossModuleAvailability } = await import(
      "@/lib/availability/cross-module"
    );
    const result = await checkCrossModuleAvailability(
      TENANT,
      new Date("2026-12-24"),
      [{ type: "instructor", level: "TD2", qty: 2, station: "baqueira" }],
    );

    expect(result.ok).toBe(false);
    expect(result.items[0].available).toBe(1);
    expect(result.items[0].reason).toMatch(/profesor/i);
  });
});
