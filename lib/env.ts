import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  SUPER_ADMIN_USERNAME: z.string().min(1).default("superadmin"),
  SUPER_ADMIN_PASSWORD: z.string().min(1),
  PUBLIC_REGISTRATION_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RESTFUL_API_DEV_BASE_URL: z.string().url().default("https://api.restful-api.dev"),
  RESTFUL_API_DEV_API_KEY: z.string().optional()
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.message}`);
  if (parsed.data.NODE_ENV === "production") {
    if (parsed.data.SUPER_ADMIN_PASSWORD === "superadmin") throw new Error("Default super-admin password is forbidden in production");
    if (!parsed.data.DATABASE_URL) throw new Error("DATABASE_URL is required in production");
    if (!process.env.NEXTAUTH_URL?.startsWith("https://")) throw new Error("NEXTAUTH_URL must use HTTPS in production");
  }
  return parsed.data;
}
