import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function resolveApiUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    try {
      const tokenUser = await verifyAccessToken(authorization.slice(7));
      const user = await prisma.user.findUnique({ where: { id: tokenUser.userId } });
      if (user?.status === "ACTIVE") return user;
    } catch { return null; }
  }
  const session = await auth();
  if (session?.user?.id) return prisma.user.findUnique({ where: { id: session.user.id } });
  return null;
}

export function unauthorized() { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
