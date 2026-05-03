import { z } from "zod";

const envSchema = z.object({
  // App
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).default("true"),

  // Database
  DATABASE_URL: z.string().startsWith("postgresql://"),

  // Redis
  REDIS_URL: z.string().startsWith("redis"),

  // GHL
  GHL_CLIENT_ID: z.string().min(1),
  GHL_CLIENT_SECRET: z.string().min(1),
  GHL_REDIRECT_URI: z.string().url(),
  // GHL_WEBHOOK_SECRET removed — webhook verification now uses GHL's RSA public key

  // Encryption
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex-encoded

  // Feature flags
  ENABLE_NOTIFICATIONS: z.enum(["true", "false"]).default("true"),
  ENABLE_WEBHOOK_LOGGING: z.enum(["true", "false"]).default("true"),
  ENABLE_MOCK_GHL: z.enum(["true", "false"]).default("false"),

  // S3 Storage (optional — S3 service uses process.env directly)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional().default("auto"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // Public lead intake — fallback tenantId for forms that have no slug context
  // (e.g. marketing site /contacto). When unset, public forms with no slug
  // and no tenantSlug in body are rejected with 400.
  DEFAULT_TENANT_ID: z.string().optional(),

  // Optional
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
