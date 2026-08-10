import { PermissionAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateFeatureAccessCodes } from "@/lib/rbac/access-codes";

const actions = [["AM", PermissionAction.MENU], ["AD", PermissionAction.ADD], ["ED", PermissionAction.EDIT], ["DD", PermissionAction.DELETE]] as const;

export async function createFeatureWithPermissions(input: { name: string; routePath: string; icon?: string; sortOrder?: number }) {
  return prisma.$transaction(async (tx) => {
    const feature = await tx.menuFeature.create({ data: input });
    const superAdmin = await tx.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
    const codes = generateFeatureAccessCodes(await tx.menuFeature.count());
    for (const [[, action], code] of actions.map((action, index) => [action, codes[index]] as const)) {
      const permission = await tx.permission.create({ data: { code, action, featureId: feature.id } });
      await tx.rolePermission.create({ data: { roleId: superAdmin.id, permissionId: permission.id } });
    }
    return tx.menuFeature.findUniqueOrThrow({ where: { id: feature.id }, include: { permissions: true } });
  });
}

export async function replaceUserRoles(userId: string, roleIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.isSystemProtected) throw new Error("PROTECTED_USER");
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.userRole.createMany({ data: [...new Set(roleIds)].map((roleId) => ({ userId, roleId })) });
  });
}

export async function replaceRolePermissions(roleId: string, permissionIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUniqueOrThrow({ where: { id: roleId } });
    if (role.isSystemRole && role.code === "SUPER_ADMIN") throw new Error("PROTECTED_ROLE");
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.rolePermission.createMany({ data: [...new Set(permissionIds)].map((permissionId) => ({ roleId, permissionId })) });
  });
}

export async function protectSystemUserMutation(userId: string, data: { status?: "ACTIVE" | "DISABLED" }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.isSystemProtected && data.status === "DISABLED") throw new Error("PROTECTED_USER");
  return prisma.$transaction(async (tx) => {
    const result = await tx.user.update({ where: { id: userId }, data });
    if (data.status === "DISABLED") await tx.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
    return result;
  });
}
