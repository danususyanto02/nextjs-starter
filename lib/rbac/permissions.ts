import { prisma } from "@/lib/prisma";

export async function getEffectivePermissions(userId: string) {
  const [userRoles, memberships] = await Promise.all([
    prisma.userRole.findMany({ where: { userId }, select: { role: { select: { code: true, rolePermissions: { select: { permission: { select: { code: true } } } } } } } }),
    prisma.organizationMember.findMany({ where: { userId }, select: { organization: { select: { roles: { select: { role: { select: { code: true, rolePermissions: { select: { permission: { select: { code: true } } } } } } } } } } } })
  ]);
  const roleCodes = new Set<string>(); const codes = new Set<string>();
  for (const source of [...userRoles.map((item) => item.role), ...memberships.flatMap((item) => item.organization.roles.map((role) => role.role))]) { roleCodes.add(source.code); for (const permission of source.rolePermissions) codes.add(permission.permission.code); }
  return { roleCodes, codes };
}

export async function hasAccess(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSystemProtected: true, userRoles: { select: { role: { select: { code: true } } } } } });
  if (!user) return false;
  if (user.isSystemProtected || user.userRoles.some(({ role }) => role.code === "SUPER_ADMIN")) return true;
  return (await getEffectivePermissions(userId)).codes.has(code);
}
