import { NextResponse } from "next/server"; import { getOpenApiDocument } from "@/lib/openapi/document";
import { enforceRateLimit } from "@/lib/rate-limit/request"; import { rateLimitConfig } from "@/lib/rate-limit/config";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; const limited = await enforceRateLimit(`docs:${ip}`, ...rateLimitConfig.docs); if (limited) return limited; return NextResponse.json(getOpenApiDocument()); }
