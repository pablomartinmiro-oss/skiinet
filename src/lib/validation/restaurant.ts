import { z } from "zod";

// ==================== RESTAURANTS (VENUES) ====================
export const createRestaurantSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  capacity: z.number().int().min(0).default(0),
  depositPerGuest: z.coerce.number().min(0).default(0),
  operatingDays: z
    .array(z.number().int().min(0).max(6))
    .default([1, 2, 3, 4, 5]),
  description: z.string().max(2000).optional().nullable(),
  active: z.boolean().default(true),
});
export const updateRestaurantSchema = createRestaurantSchema.partial();

// ==================== SHIFTS ====================
export const createShiftSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(100),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  maxCapacity: z.number().int().min(0).default(0),
  duration: z.number().int().min(15).max(480).default(90),
});
export const updateShiftSchema = createShiftSchema
  .partial()
  .omit({ restaurantId: true });

// ==================== CLOSURES ====================
export const createClosureSchema = z.object({
  restaurantId: z.string().min(1),
  date: z.coerce.date(),
  reason: z.string().max(500).optional().nullable(),
});

// ==================== BOOKINGS ====================
// Accepts either an explicit `clientId` OR an inline `clientName` + contact
// info. The route upserts a Client row when only the inline data is given so
// the CLIENTE column never renders empty.
export const createRestaurantBookingSchema = z.object({
  restaurantId: z.string().min(1),
  clientId: z.string().optional().nullable(),
  clientName: z.string().max(200).optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().max(50).optional().nullable(),
  date: z.coerce.date(),
  time: z.string().min(1),
  guestCount: z.number().int().min(1).max(100),
  specialRequests: z.string().max(2000).optional().nullable(),
  status: z
    .enum(["confirmed", "cancelled", "no_show"])
    .default("confirmed"),
  depositStatus: z.enum(["pending", "paid"]).default("pending"),
  operationalNotes: z.string().max(2000).optional().nullable(),
});
export const updateRestaurantBookingSchema =
  createRestaurantBookingSchema
    .partial()
    .omit({ restaurantId: true });

// ==================== STAFF ====================
export const assignStaffSchema = z.object({
  restaurantId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["staff", "manager", "chef"]).default("staff"),
});

// ==================== DAILY MENU ====================
export const createDailyMenuSchema = z.object({
  date: z.coerce.date(),
  firstCourse: z.string().max(2000).default(""),
  secondCourse: z.string().max(2000).default(""),
  dessert: z.string().max(2000).default(""),
  price: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
  notes: z.string().max(2000).optional().nullable(),
});
export const updateDailyMenuSchema = createDailyMenuSchema.partial();

// ==================== SIMPLE RESTAURANT RESERVATION ====================
export const createRestaurantReservationSchema = z.object({
  date: z.coerce.date(),
  time: z.string().min(1).max(10),
  guestCount: z.number().int().min(1).max(50),
  guestName: z.string().min(1).max(200),
  guestPhone: z.string().max(50).optional().nullable(),
  guestEmail: z.string().email().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z
    .enum(["confirmada", "cancelada", "no_show"])
    .default("confirmada"),
});
export const updateRestaurantReservationSchema =
  createRestaurantReservationSchema.partial();
