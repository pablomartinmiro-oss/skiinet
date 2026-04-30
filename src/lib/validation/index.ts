import { z } from "zod";

// Re-export all schemas from sub-files
export * from "./core";
export * from "./catalog";
export * from "./booking";
export * from "./hotel";
export * from "./restaurant";
export * from "./spa";
export * from "./finance";
export * from "./suppliers";
export * from "./tpv";
export * from "./reav";
export * from "./storefront";
export * from "./cms";
export * from "./packs";
export * from "./reviews";
export * from "./ticketing";
export * from "./payroll";
export * from "./cancellations";
export * from "./instructors";
export * from "./planning";
export * from "./rental";
export * from "./leads";

// ==================== HELPER ====================
/**
 * Validate request body against a Zod schema.
 * Returns { data } on success, { error, status: 400 } on failure.
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, error: issues };
  }
  return { ok: true, data: result.data };
}
