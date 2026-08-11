import { z } from "zod";

export const resourceConfigs = {
  users: {
    model: "user",
    view: "AM0000002",
    add: "AD0000002",
    edit: "ED0000002",
    remove: "DD0000002",
    create: z.object({ username: z.string().min(3), password: z.string().min(8), displayName: z.string().optional(), email: z.string().email().optional() }),
    update: z.object({ displayName: z.string().optional(), email: z.string().email().optional(), status: z.enum(["ACTIVE", "DISABLED"]).optional() }),
    list: { select: { id: true, username: true, displayName: true, email: true, status: true, createdAt: true, updatedAt: true, isSystemProtected: true }, searchFields: ["username", "displayName", "email"], statusField: "status", sortFields: ["username", "displayName", "email", "status", "createdAt"] as const }
  },
  roles: {
    model: "role",
    view: "AM0000003",
    add: "AD0000003",
    edit: "ED0000003",
    remove: "DD0000003",
    create: z.object({ name: z.string().min(1), code: z.string().min(1) }),
    update: z.object({ name: z.string().min(1).optional(), status: z.enum(["ACTIVE", "DISABLED"]).optional() }),
    list: { select: { id: true, name: true, code: true, status: true, createdAt: true, updatedAt: true, isSystemRole: true }, searchFields: ["name", "code"], statusField: "status", sortFields: ["name", "code", "status", "createdAt"] as const }
  },
  organizations: {
    model: "organization",
    view: "AM0000004",
    add: "AD0000004",
    edit: "ED0000004",
    remove: "DD0000004",
    create: z.object({ name: z.string().min(1), code: z.string().min(1) }),
    update: z.object({ name: z.string().min(1).optional(), status: z.enum(["ACTIVE", "DISABLED"]).optional() }),
    list: { select: { id: true, name: true, code: true, status: true, createdAt: true, updatedAt: true }, searchFields: ["name", "code"], statusField: "status", sortFields: ["name", "code", "status", "createdAt"] as const }
  },
  features: {
    model: "menuFeature",
    view: "AM0000005",
    add: "AD0000005",
    edit: "ED0000005",
    remove: "DD0000005",
    create: z.object({ name: z.string().min(1), routePath: z.string().startsWith("/"), icon: z.string().optional(), sortOrder: z.number().int().optional() }),
    update: z.object({ name: z.string().min(1).optional(), status: z.enum(["ACTIVE", "DISABLED"]).optional(), recordLockEnabled: z.boolean().optional() }),
    list: { select: { id: true, name: true, routePath: true, icon: true, sortOrder: true, parentId: true, status: true, recordLockEnabled: true, createdAt: true, updatedAt: true }, searchFields: ["name", "routePath"], statusField: "status", sortFields: ["name", "routePath", "sortOrder", "recordLockEnabled", "status", "createdAt"] as const }
  }
} as const;
