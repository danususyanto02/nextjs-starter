import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { ListQuery } from "@/lib/api/pagination";

const TTL_SECONDS = 120;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function lockEnabled(resourceType: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { id: "system" } });
  if (setting?.recordLockEnabled === false) return false;
  const featureNames: Record<string, string> = { user: "User Management", role: "Role Management", organization: "Organization Management", menuFeature: "Menu/Feature Management" };
  const feature = await prisma.menuFeature.findFirst({ where: { name: featureNames[resourceType] ?? resourceType } });
  return feature?.recordLockEnabled !== false;
}

export async function acquireLock(ownerUserId: string, resourceType: string, resourceId: string) {
  if (!(await lockEnabled(resourceType))) return { enabled: false as const, token: null, lock: null };
  const token = randomBytes(32).toString("base64url");
  const now = new Date(); const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000);
  try {
    const lock = await prisma.$transaction(async (tx) => {
      const existing = await tx.recordLock.findUnique({ where: { resourceType_resourceId: { resourceType, resourceId } } });
      if (existing && existing.expiresAt > now) return null;
      if (existing) await tx.recordLock.delete({ where: { id: existing.id } });
      return tx.recordLock.create({ data: { resourceType, resourceId, ownerUserId, lockTokenHash: hash(token), expiresAt } });
    });
    if (!lock) return { enabled: true as const, token: null, lock: await getLock(resourceType, resourceId) };
    return { enabled: true as const, token, lock: await getLock(resourceType, resourceId) };
  } catch (caught) { if ((caught as { code?: string }).code === "P2002") return { enabled: true as const, token: null, lock: await getLock(resourceType, resourceId) }; throw caught; }
}

export async function getLock(resourceType: string, resourceId: string) { const lock = await prisma.recordLock.findUnique({ where: { resourceType_resourceId: { resourceType, resourceId } }, include: { ownerUser: { select: { id: true, username: true, displayName: true } } } }); return lock && lock.expiresAt > new Date() ? lock : null; }
export async function heartbeatLock(userId: string, id: string, token: string) { const lock = await prisma.recordLock.findFirst({ where: { id, ownerUserId: userId, lockTokenHash: hash(token), expiresAt: { gt: new Date() } } }); if (!lock) return null; return prisma.recordLock.update({ where: { id }, data: { heartbeatAt: new Date(), expiresAt: new Date(Date.now() + TTL_SECONDS * 1000) } }); }
export async function releaseLock(userId: string, id: string, token: string) { return prisma.recordLock.deleteMany({ where: { id, ownerUserId: userId, lockTokenHash: hash(token) } }); }
export async function forceReleaseLock(id: string) { return prisma.recordLock.delete({ where: { id } }); }

export async function listLocks(query: ListQuery) {
  await prisma.recordLock.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  const where = query.search ? { OR: [{ resourceType: { contains: query.search, mode: "insensitive" as const } }, { resourceId: { contains: query.search, mode: "insensitive" as const } }, { ownerUser: { is: { OR: [{ username: { contains: query.search, mode: "insensitive" as const } }, { displayName: { contains: query.search, mode: "insensitive" as const } }] } } }] } : undefined;
  const orderBy = query.sortBy === "acquiredAt" || query.sortBy === "expiresAt" || query.sortBy === "resourceType" || query.sortBy === "resourceId" ? [{ [query.sortBy]: query.sortDirection }, { id: "asc" as const }] : [{ acquiredAt: "desc" as const }, { id: "asc" as const }];
  const [data, total] = await Promise.all([
    prisma.recordLock.findMany({ where, include: { ownerUser: { select: { id: true, username: true, displayName: true } } }, orderBy, skip: query.offset, take: query.limit }),
    prisma.recordLock.count({ where })
  ]);
  return { data, meta: { limit: query.limit, offset: query.offset, total } };
}

export async function releaseUserLocks(userId: string) { return prisma.recordLock.deleteMany({ where: { ownerUserId: userId } }); }
export async function requireLock(resourceType: string, resourceId: string, userId: string, token: string | null) { if (!(await lockEnabled(resourceType))) return true; if (!token) return false; const lock = await prisma.recordLock.findFirst({ where: { resourceType, resourceId, ownerUserId: userId, lockTokenHash: hash(token), expiresAt: { gt: new Date() } } }); return Boolean(lock); }
export { TTL_SECONDS };
