import { checkRateLimit } from "@/lib/rate-limit/limiter"; import { rateLimitResponse } from "@/lib/rate-limit/response";
export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) { const result = await checkRateLimit(key, limit, windowSeconds); return result.allowed ? null : rateLimitResponse(result); }
