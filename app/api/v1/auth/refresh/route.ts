import { NextResponse } from "next/server";
import { z } from "zod";
import { issueAccessToken, rotateRefreshToken, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "@/lib/auth/tokens";
import { enforceRateLimit } from "@/lib/rate-limit/request"; import { rateLimitConfig } from "@/lib/rate-limit/config";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; const limited = await enforceRateLimit(`refresh:${ip}`, ...rateLimitConfig.refresh); if (limited) return limited;
  const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" } }, { status: 401 });
  try {
    const rotated = await rotateRefreshToken(parsed.data.refreshToken);
    const accessToken = await issueAccessToken(rotated.user.id, rotated.user.username);
    return NextResponse.json({ data: { accessToken, refreshToken: rotated.token, tokenType: "Bearer", expiresIn: ACCESS_TTL_SECONDS, refreshExpiresIn: REFRESH_TTL_SECONDS } });
  } catch { return NextResponse.json({ error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" } }, { status: 401 }); }
}
