import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit/limiter";
export function rateLimitResponse(result: RateLimitResult) { return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "X-RateLimit-Limit": String(result.limit), "X-RateLimit-Remaining": String(result.remaining) } }); }
