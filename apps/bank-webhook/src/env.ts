import { z } from "zod";

/**
 * Centralized environment variable validation for the Razorpay webhook server.
 * Fails at startup with a clear message if any required variable is missing.
 */
const envSchema = z.object({
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(
      16,
      "RAZORPAY_WEBHOOK_SECRET must be at least 16 characters. Set this in Razorpay Dashboard → Webhooks",
    ),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.string().optional().default("3003"),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error("❌ Invalid environment variables for webhook server:");
  console.error(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = _parsed.data;
