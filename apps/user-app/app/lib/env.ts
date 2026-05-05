import { z } from "zod";

/**
 * Centralized environment variable validation using Zod.
 * This module throws at import time if any required env var is missing or invalid,
 * giving a clear error message instead of cryptic runtime failures.
 */
const envSchema = z.object({
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32"),
    NEXTAUTH_URL: z
        .string()
        .min(1, "NEXTAUTH_URL is required (e.g., http://localhost:3001)"),
    NEXTAUTH_SECRET: z
        .string()
        .min(1, "NEXTAUTH_SECRET is required"),
    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required (e.g., postgresql://user:pass@localhost:5432/paytm)"),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2));
    // In Next.js we throw rather than process.exit so the error surfaces clearly
    throw new Error(
        "Invalid environment configuration. Check the server logs for details."
    );
}

export const env = _parsed.data;
