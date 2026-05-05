import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Simple in-memory rate limiter for authentication routes.
 *
 * ⚠️  This works correctly in development and single-instance production.
 *     For multi-instance deployments, replace with a Redis-backed solution
 *     (e.g., @upstash/ratelimit) so the counter is shared across instances.
 */
const authRateLimit = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 60_000; // 1 minute
const AUTH_MAX_ATTEMPTS = 10;   // max 10 auth attempts per minute per IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = authRateLimit.get(ip);

    if (!record || now > record.resetAt) {
        authRateLimit.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
        return false;
    }

    if (record.count >= AUTH_MAX_ATTEMPTS) {
        return true;
    }

    record.count++;
    return false;
}

export default withAuth(
    function middleware(req: NextRequest) {
        // Apply rate limit only on POST to signin (credentials submission)
        if (req.method === "POST" && req.nextUrl.pathname === "/api/auth/callback/credentials") {
            const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
                ?? req.headers.get("x-real-ip")
                ?? "unknown";

            if (isRateLimited(ip)) {
                return new NextResponse(
                    JSON.stringify({ message: "Too many requests. Please wait a minute and try again." }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "Retry-After": "60",
                        },
                    }
                );
            }
        }

        return NextResponse.next();
    },
    {
        // Pass the secret explicitly — required in the Edge runtime
        secret: process.env.NEXTAUTH_SECRET,
        pages: {
            signIn: "/api/auth/signin",
        },
    }
);

// Protect dashboard routes ONLY — never include /api/auth/* here,
// as that would create a circular redirect blocking the sign-in flow.
export const config = {
    matcher: [
        "/dashboard",
        "/transfer",
        "/transactions",
        "/p2p",
        "/profile",
    ],
};
