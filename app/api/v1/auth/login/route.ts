import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueAccessToken, issueRefreshToken, verifyPassword, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "@/lib/auth/tokens";
import { enforceRateLimit } from "@/lib/rate-limit/request"; import { rateLimitConfig } from "@/lib/rate-limit/config";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const body = await request.clone().json().catch(() => ({}));
  const limited = await enforceRateLimit(`login:${ip}:${typeof body.username === "string" ? body.username : "unknown"}`, ...rateLimitConfig.login); if (limited) return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || user.status !== "ACTIVE" || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } }, { status: 401 });
  const [accessToken, refreshToken] = await Promise.all([issueAccessToken(user.id, user.username), issueRefreshToken(user.id)]);
  return NextResponse.json({ data: { accessToken, refreshToken, tokenType: "Bearer", expiresIn: ACCESS_TTL_SECONDS, refreshExpiresIn: REFRESH_TTL_SECONDS } });
}
