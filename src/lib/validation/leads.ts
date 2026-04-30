import { z } from "zod";

export const LEAD_STATUS = ["nuevo", "contactado", "calificado", "convertido", "perdido"] as const;
export const LEAD_SOURCE = ["manual", "web", "import", "storefront", "referral"] as const;

export const leadStatusSchema = z.enum(LEAD_STATUS);
export const leadSourceSchema = z.enum(LEAD_SOURCE);

export const createLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: leadSourceSchema.optional().default("manual"),
  status: leadStatusSchema.optional().default("nuevo"),
  pipelineStage: z.string().max(50).optional(),
  score: z.coerce.number().int().min(0).max(100).optional().default(0),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  customFields: z.record(z.string(), z.unknown()).optional(),
  lastContactedAt: z.coerce.date().optional().nullable(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: leadSourceSchema.optional(),
  status: leadStatusSchema.optional(),
  pipelineStage: z.string().max(50).optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  lastContactedAt: z.coerce.date().optional().nullable(),
  convertedAt: z.coerce.date().optional().nullable(),
  lostReason: z.string().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const importLeadsSchema = z.object({
  leads: z.array(createLeadSchema).min(1).max(1000),
});

export const leadFilterSchema = z.object({
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  assignedTo: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().max(200).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
  sortBy: z.enum(["createdAt", "updatedAt", "score", "name", "status"]).optional().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const convertLeadSchema = z.object({
  destination: z.string().min(1).max(100).optional().default("Pendiente"),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  adults: z.coerce.number().int().min(0).max(50).optional().default(2),
  children: z.coerce.number().int().min(0).max(50).optional().default(0),
  notes: z.string().max(5000).optional().nullable(),
});
