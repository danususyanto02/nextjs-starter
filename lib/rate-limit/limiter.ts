import { prisma } from "@/lib/prisma";

export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; retryAfterSeconds: number };
export async function checkRateLimit(key: string, limit: number, windowSeconds: number, enabled = process.env.RATE_LIMIT_ENABLED !== "false"): Promise<RateLimitResult> {
  if (!enabled) return { allowed: true, limit, remaining: limit, retryAfterSeconds: 0 };
  const now = new Date(); const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitEntry.findUnique({ where: { key } });
    if (!current || current.expiresAt <= now) {
      const next = current ? await tx.rateLimitEntry.update({ where: { key }, data: { count: 1, windowStartedAt: now, expiresAt } }) : await tx.rateLimitEntry.create({ data: { key, count: 1, windowStartedAt: now, expiresAt } });
      return { count: next.count, expiresAt: next.expiresAt };
    }
    if (current.count >= limit) return { count: current.count, expiresAt: current.expiresAt };
    const next = await tx.rateLimitEntry.update({ where: { key }, data: { count: { increment: 1 } } }); return { count: next.count, expiresAt: next.expiresAt };
  });
  const retryAfterSeconds = Math.max(1, Math.ceil((result.expiresAt.getTime() - now.getTime()) / 1000));
  return { allowed: result.count <= limit, limit, remaining: Math.max(0, limit - result.count), retryAfterSeconds };
}
