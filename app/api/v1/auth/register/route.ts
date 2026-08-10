import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit/request"; import { rateLimitConfig } from "@/lib/rate-limit/config";

const schema = z.object({ username: z.string().min(3).max(100), password: z.string().min(8).max(200), displayName: z.string().max(200).optional() });
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"; const limited = await enforceRateLimit(`register:${ip}`, ...rateLimitConfig.register); if (limited) return limited;
  if (process.env.PUBLIC_REGISTRATION_ENABLED === "false") return NextResponse.json({ error: { code: "REGISTRATION_DISABLED", message: "Registration is disabled" } }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid registration data" } }, { status: 422 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { username: parsed.data.username, passwordHash: await argon2.hash(parsed.data.password), displayName: parsed.data.displayName } });
      const role = await tx.role.findUniqueOrThrow({ where: { code: "USER" } });
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      return user;
    });
    return NextResponse.json({ data: { id: result.id, username: result.username, displayName: result.displayName } }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: { code: "CONFLICT", message: "Username is already in use" } }, { status: 409 });
    return NextResponse.json({ error: { code: "REGISTRATION_FAILED", message: "Registration failed" } }, { status: 500 });
  }
}
