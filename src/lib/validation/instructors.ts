import { z } from "zod";

// ==================== INSTRUCTOR PROFILE ====================

export const createInstructorSchema = z.object({
  userId: z.string().min(1, "El usuario es obligatorio"),
  tdLevel: z.enum(["TD1", "TD2", "TD3"]),
  disciplines: z.array(z.string()).min(1, "Al menos una disciplina"),
  specialties: z.array(z.string()).default([]),
  languages: z.array(z.string()).min(1, "Al menos un idioma"),
  maxLevel: z.enum(["A", "B", "C", "D"]).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).default(0),
  perStudentBonus: z.coerce.number().min(0).default(0),
  contractType: z
    .enum(["fijo_discontinuo", "temporal", "autonomo"])
    .default("fijo_discontinuo"),
  station: z.string().min(1, "La estacion es obligatoria"),
  seasonStart: z.coerce.date().optional().nullable(),
  seasonEnd: z.coerce.date().optional().nullable(),
  certExpiry: z.coerce.date().optional().nullable(),
  certNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInstructorSchema = createInstructorSchema.partial();

// ==================== AVAILABILITY ====================

export const instructorAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
      isActive: z.boolean().default(true),
    })
  ),
});

// ==================== TIME ENTRIES (FICHAJE) ====================

export const clockInSchema = z.object({
  instructorId: z.string().min(1),
  source: z.enum(["manual", "mobile", "kiosk"]).default("manual"),
  geoLat: z.number().optional().nullable(),
  geoLon: z.number().optional().nullable(),
});

export const clockOutSchema = z.object({
  breakMinutes: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  clockOutLat: z.number().optional().nullable(),
  clockOutLon: z.number().optional().nullable(),
});

export const lockTimeEntriesSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  instructorId: z.string().optional(),
});

export const timeEntryCorrectionSchema = z.object({
  correctionOf: z.string().min(1),
  correctionReason: z
    .string()
    .min(1, "El motivo de correccion es obligatorio")
    .max(500),
  clockIn: z.coerce.date(),
  clockOut: z.coerce.date(),
  breakMinutes: z.coerce.number().int().min(0).default(0),
});

// ==================== ASSIGNMENTS ====================

export const createAssignmentSchema = z.object({
  instructorId: z.string().min(1),
  bookingId: z.string().min(1),
  lessonType: z.enum(["group", "private", "adaptive"]),
  studentCount: z.coerce.number().int().min(1).default(1),
  scheduledStart: z.string().regex(/^\d{2}:\d{2}$/),
  scheduledEnd: z.string().regex(/^\d{2}:\d{2}$/),
  surcharge: z.coerce.number().min(0).default(0),
  surchargeReason: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  status: z
    .enum(["assigned", "in_progress", "completed", "cancelled", "no_show"])
    .optional(),
  studentCount: z.coerce.number().int().min(1).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
