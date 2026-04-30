import { z } from "zod";

// ==================== QUOTES ====================
export const createQuoteSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().max(30).optional().nullable(),
  clientNotes: z.string().max(5000).optional().nullable(),
  destination: z.string().min(1).max(100),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  adults: z.number().int().min(0).max(50).default(2),
  children: z.number().int().min(0).max(50).default(0),
  wantsAccommodation: z.boolean().default(false),
  wantsForfait: z.boolean().default(false),
  wantsClases: z.boolean().default(false),
  wantsEquipment: z.boolean().default(false),
  ghlContactId: z.string().optional().nullable(),
});

export const updateQuoteSchema = z.object({
  status: z.enum(["nuevo", "borrador", "en_proceso", "enviado", "pagado", "expirado", "cancelado"]).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  clientNotes: z.string().max(5000).optional().nullable(),
});

const quoteItemReplaceSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1).max(500),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1).max(100).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  numDays: z.coerce.number().int().min(1).max(30).optional().nullable(),
  numPersons: z.coerce.number().int().min(1).max(50).optional().nullable(),
  ageDetails: z.unknown().optional(),
  modalidad: z.string().max(100).optional().nullable(),
  nivel: z.string().max(100).optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  idioma: z.string().max(100).optional().nullable(),
  horario: z.string().max(100).optional().nullable(),
  puntoEncuentro: z.string().max(200).optional().nullable(),
  tipoCliente: z.string().max(100).optional().nullable(),
  gama: z.string().max(100).optional().nullable(),
  casco: z.boolean().optional().nullable(),
  tipoActividad: z.string().max(100).optional().nullable(),
  regimen: z.string().max(100).optional().nullable(),
  alojamientoNombre: z.string().max(200).optional().nullable(),
  seguroIncluido: z.boolean().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const bulkReplaceQuoteItemsSchema = z.object({
  items: z.array(quoteItemReplaceSchema).max(50),
});

export const quoteItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date().optional().nullable(),
  numDays: z.number().int().min(1).max(30).optional().nullable(),
  numPersons: z.number().int().min(1).max(50).optional().nullable(),
});

// ==================== RESERVATIONS ====================
const participantSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["bebe", "infantil", "adulto"]),
  service: z.string().max(200).optional().nullable(),
  level: z.string().max(100).optional().nullable(),
  material: z.boolean().optional().nullable(),
});

const serviceItemSchema = z.object({
  type: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(100),
  modality: z.string().max(100).optional().nullable(),
  level: z.string().max(100).optional().nullable(),
  days: z.number().int().min(1).max(30).optional().nullable(),
});

export const createReservationSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().max(30).optional().nullable(),
  couponCode: z.string().max(100).optional().nullable(),
  source: z.string().min(1).max(100),
  station: z.string().min(1).max(100),
  activityDate: z.coerce.date(),
  schedule: z.string().max(100).optional().nullable(),
  language: z.string().max(10).optional().default("es"),
  participants: z.array(participantSchema).max(100).optional().nullable(),
  services: z.array(serviceItemSchema).max(50).optional().nullable(),
  totalPrice: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.string().max(50).optional().nullable(),
  paymentRef: z.string().max(200).optional().nullable(),
  status: z
    .enum(["pendiente", "confirmada", "completada", "sin_disponibilidad", "cancelada", "eliminada"])
    .optional()
    .default("pendiente"),
  notes: z.string().max(5000).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  notificationType: z.string().max(50).optional().nullable(),
  quoteId: z.string().max(50).optional().nullable(),
  // Groupon voucher fields
  voucherSecurityCode: z.string().max(100).optional().nullable(),
  voucherCouponCode: z.string().max(100).optional().nullable(),
  voucherProduct: z.string().max(200).optional().nullable(),
  voucherPricePaid: z.coerce.number().min(0).optional().nullable(),
  voucherExpiry: z.coerce.date().optional().nullable(),
  voucherRedeemed: z.boolean().optional().default(false),
  voucherRedeemedAt: z.coerce.date().optional().nullable(),
});

export const updateReservationSchema = z.object({
  status: z
    .enum(["pendiente", "confirmada", "completada", "sin_disponibilidad", "cancelada", "eliminada"])
    .optional(),
  clientName: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().optional().nullable(),
  clientPhone: z.string().max(30).optional().nullable(),
  couponCode: z.string().max(100).optional().nullable(),
  station: z.string().min(1).max(100).optional(),
  activityDate: z.coerce.date().optional(),
  schedule: z.string().max(100).optional().nullable(),
  language: z.string().max(10).optional(),
  totalPrice: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  paymentMethod: z.string().max(50).optional().nullable(),
  paymentRef: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  notificationType: z.string().max(50).optional().nullable(),
  participants: z.array(participantSchema).max(100).optional().nullable(),
  services: z.array(serviceItemSchema).max(50).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// ==================== SEASON CALENDAR ====================
export const seasonCalendarSchema = z.object({
  station: z.string().min(1).max(100),
  season: z.enum(["media", "alta"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  label: z.string().max(100).optional().nullable(),
});

// ==================== ACTIVITY BOOKINGS ====================
export const createActivityBookingSchema = z.object({
  reservationId: z.string().min(1),
  activityDate: z.coerce.date(),
  status: z.enum(["scheduled", "pending", "confirmed", "cancelled"]).default("scheduled"),
  operationalNotes: z.string().max(2000).optional().nullable(),
});
export const updateActivityBookingSchema = z.object({
  status: z.enum(["scheduled", "pending", "confirmed", "cancelled", "incident"]).optional(),
  operationalNotes: z.string().max(2000).optional().nullable(),
  arrivedClient: z.boolean().optional(),
});

// ==================== BOOKING MONITORS ====================
export const assignMonitorSchema = z.object({
  bookingId: z.string().min(1),
  userId: z.string().min(1),
});

// ==================== DAILY ORDERS ====================
export const createDailyOrderSchema = z.object({
  date: z.coerce.date(),
  notes: z.string().max(5000).optional().nullable(),
});
export const updateDailyOrderSchema = z.object({
  notes: z.string().max(5000).optional().nullable(),
});

// ==================== APPLY DISCOUNT ====================
export const applyReservationDiscountSchema = z.object({
  code: z.string().min(1).max(50),
});

// ==================== ACTIVITY INCIDENT ====================
export const flagActivityIncidentSchema = z.object({
  incidentNotes: z.string().min(1).max(2000),
});

// ==================== CLIENTS ====================
export const skiLevelEnum = z.enum(["principiante", "intermedio", "avanzado", "experto"]);
export const helmetSizeEnum = z.enum(["S", "M", "L", "XL"]);
export const clientLanguageEnum = z.enum(["es", "en", "fr", "de", "pt"]);

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  conversionSource: z.string().max(100).optional().nullable(),
  // Ski profile
  skiLevel: skiLevelEnum.optional().nullable(),
  preferredStation: z.string().max(100).optional().nullable(),
  bootSize: z.string().max(10).optional().nullable(),
  height: z.coerce.number().int().min(50).max(250).optional().nullable(),
  weight: z.coerce.number().int().min(10).max(300).optional().nullable(),
  helmetSize: helmetSizeEnum.optional().nullable(),
  language: clientLanguageEnum.optional().nullable(),
  dni: z.string().max(30).optional().nullable(),
});
export const updateClientSchema = createClientSchema.partial();
