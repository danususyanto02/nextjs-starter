import "dotenv/config";
import { PrismaClient, PermissionAction, FeatureStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const features = [
  ["Dashboard", "/dashboard"],
  ["User Management", "/dashboard/users"],
  ["Role Management", "/dashboard/roles"],
  ["Organization Management", "/dashboard/organizations"],
  ["Menu/Feature Management", "/dashboard/features"],
  ["Locked Records", "/dashboard/locked-records"],
  ["External API Demo", "/dashboard/external-api-demo"]
] as const;

async function main() {
  const username = process.env.SUPER_ADMIN_USERNAME ?? "superadmin";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin";
  if (process.env.NODE_ENV === "production" && password === "superadmin") throw new Error("Default super-admin password is forbidden in production");
  const hash = await argon2.hash(password);
  const superAdmin = await prisma.role.upsert({ where: { code: "SUPER_ADMIN" }, update: { name: "Super Admin", status: "ACTIVE", isSystemRole: true }, create: { name: "Super Admin", code: "SUPER_ADMIN", isSystemRole: true } });
  const admin = await prisma.role.upsert({ where: { code: "ADMIN" }, update: {}, create: { name: "Admin", code: "ADMIN", isSystemRole: true } });
  const userRole = await prisma.role.upsert({ where: { code: "USER" }, update: {}, create: { name: "User", code: "USER", isSystemRole: true } });
  const user = await prisma.user.upsert({ where: { username }, update: { passwordHash: hash, isSystemProtected: true, status: "ACTIVE" }, create: { username, passwordHash: hash, displayName: "Super Administrator", isSystemProtected: true } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } }, update: {}, create: { userId: user.id, roleId: superAdmin.id } });
  await prisma.systemSetting.upsert({ where: { id: "system" }, update: { recordLockEnabled: true }, create: { id: "system", recordLockEnabled: true } });
  for (const [index, [name, routePath]] of features.entries()) {
    const feature = await prisma.menuFeature.upsert({ where: { routePath }, update: { name, sortOrder: index + 1, status: FeatureStatus.ACTIVE, isSystemLocked: true, recordLockEnabled: true }, create: { name, routePath, sortOrder: index + 1, isSystemLocked: true, recordLockEnabled: true } });
    for (const [prefix, action] of [["AM", PermissionAction.MENU], ["AD", PermissionAction.ADD], ["ED", PermissionAction.EDIT], ["DD", PermissionAction.DELETE]] as const) {
      const code = `${prefix}${String(index + 1).padStart(7, "0")}`;
      const permission = await prisma.permission.upsert({ where: { code }, update: { action, featureId: feature.id }, create: { code, action, featureId: feature.id } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: permission.id } }, update: {}, create: { roleId: superAdmin.id, permissionId: permission.id } });
    }
  }
  void admin; void userRole;
}

main().finally(() => prisma.$disconnect());
