import { z } from "zod";

/**
 * Centralized environment variable validation for the bank-webhook server.
 * Fails at startup with a clear message if any required variable is missing.
 */
const envSchema = z.object({
    WEBHOOK_SECRET: z
        .string()
        .min(16, "WEBHOOK_SECRET must be at least 16 characters. Generate one with: openssl rand -base64 32"),
    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required"),
    PORT: z
        .string()
        .optional()
        .default("3003"),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
    console.error("❌ Invalid environment variables for bank-webhook:");
    console.error(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2));
    process.exit(1);
}

export const env = _parsed.data;
