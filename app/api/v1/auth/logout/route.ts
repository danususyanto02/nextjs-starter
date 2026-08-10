import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (parsed.success) {
    const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hashOpaqueToken(parsed.data.refreshToken) } });
    if (token) await prisma.$transaction([prisma.refreshToken.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } }), prisma.recordLock.deleteMany({ where: { ownerUserId: token.userId } })]);
  }
  return NextResponse.json({ data: { success: true } });
}
