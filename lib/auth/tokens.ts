import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return new TextEncoder().encode(value);
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAccessToken(userId: string, username: string) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: userId, username, type: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TTL_SECONDS)
    .sign(secret());
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, secret());
  if (result.payload.type !== "access" || typeof result.payload.sub !== "string") throw new Error("Invalid access token");
  return { userId: result.payload.sub, username: typeof result.payload.username === "string" ? result.payload.username : undefined };
}

export async function issueRefreshToken(userId: string) {
  const token = randomBytes(48).toString("base64url");
  await prisma.refreshToken.create({ data: { tokenHash: hashOpaqueToken(token), userId, expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) } });
  return token;
}

export async function rotateRefreshToken(token: string) {
  const tokenHash = hashOpaqueToken(token);
  return prisma.$transaction(async (tx) => {
    const current = await tx.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!current || current.revokedAt || current.expiresAt <= new Date() || current.user.status === "DISABLED") throw new Error("Invalid refresh token");
    const replacement = randomBytes(48).toString("base64url");
    const replacementRecord = await tx.refreshToken.create({ data: { tokenHash: hashOpaqueToken(replacement), userId: current.userId, expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) } });
    await tx.refreshToken.update({ where: { id: current.id }, data: { revokedAt: new Date(), replacedById: replacementRecord.id } });
    return { token: replacement, user: current.user };
  });
}

export async function revokeUserTokens(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function verifyPassword(password: string, passwordHash: string) {
  try { return await argon2.verify(passwordHash, password); } catch { return false; }
}

export { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS };
