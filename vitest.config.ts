import { defineConfig } from "vitest/config";
import path from "path";

const sharedEnv = {
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  AUTH_URL: "http://localhost:3000",
  AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  AUTH_TRUST_HOST: "true",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ghl_dashboard_test",
  REDIS_URL: "redis://localhost:6379",
  GHL_CLIENT_ID: "test-client-id",
  GHL_CLIENT_SECRET: "test-client-secret",
  GHL_REDIRECT_URI: "http://localhost:3000/api/crm/oauth/callback",
  ENCRYPTION_KEY: "a".repeat(64),
  ENABLE_MOCK_GHL: "true",
  NODE_ENV: "test",
};

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["__tests__/**/*.test.ts", "tests/**/*.test.ts"],
          setupFiles: ["./__tests__/setup.ts"],
          env: sharedEnv,
        },
        resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
      },
      {
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          include: ["__tests__/**/*.test.tsx", "tests/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
          env: sharedEnv,
        },
        resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
