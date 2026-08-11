import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { error, mapPrismaError, ok, okPage } from "@/lib/api/response";
import { parseListQuery } from "@/lib/api/pagination";
import { parseJson } from "@/lib/api/validation";
import { requireAccess } from "@/lib/rbac/guards";
import { requireLock } from "@/lib/locks/service";

type ListConfig = {
  select: Record<string, boolean>;
  searchFields: readonly string[];
  statusField?: string;
  sortFields: readonly string[];
};
type CrudConfig = { model: "user" | "role" | "organization" | "menuFeature"; view: string; add: string; edit: string; remove: string; create: z.ZodType; update: z.ZodType; list: ListConfig };
type QueryableModel = { findMany: (args: unknown) => Promise<unknown[]>; findUnique: Function; create: Function; update: Function; delete: Function; count: (args: unknown) => Promise<number> };
const db = prisma as unknown as Record<string, QueryableModel>;

export async function listResource(request: Request, config: CrudConfig) {
  const guard = await requireAccess(request, config.view);
  if (guard.response) return guard.response;
  const parsed = parseListQuery(request, config.list.sortFields, { sortBy: "createdAt", sortDirection: "desc" });
  if ("response" in parsed) return parsed.response;
  const { limit, offset, search, sortBy, sortDirection } = parsed.data;
  const normalizedSearch = search.trim();
  const isStatusSearch = ["ACTIVE", "DISABLED"].includes(normalizedSearch.toUpperCase());
  const predicates: Record<string, unknown>[] = normalizedSearch ? [
    ...config.list.searchFields.map((field) => ({ [field]: { contains: normalizedSearch, mode: "insensitive" } })),
    ...(config.list.statusField && isStatusSearch ? [{ [config.list.statusField]: normalizedSearch.toUpperCase() }] : [])
  ] : [];
  const where: Record<string, unknown> | undefined = predicates.length ? { OR: predicates } : undefined;
  const orderBy: Record<string, "asc" | "desc">[] = sortBy === "id" ? [{ id: sortDirection }] : [{ [sortBy]: sortDirection }, { id: "asc" }];
  const [data, total] = await Promise.all([
    db[config.model].findMany({ where, orderBy, skip: offset, take: limit, select: config.list.select }),
    db[config.model].count({ where })
  ]);
  return okPage(data, { limit, offset, total });
}

export async function createResource(request: Request, config: CrudConfig) {
  const guard = await requireAccess(request, config.add);
  if (guard.response) return guard.response;
  const parsed = await parseJson(request, config.create);
  if ("response" in parsed) return parsed.response;
  try {
    const data = { ...(parsed.data as Record<string, unknown>) };
    if (config.model === "user" && typeof data.password === "string") {
      data.passwordHash = await argon2.hash(data.password);
      delete data.password;
    }
    return ok(await db[config.model].create({ data }), { status: 201 });
  } catch (caught) { return mapPrismaError(caught); }
}

export async function getResource(request: Request, id: string, config: CrudConfig) {
  const guard = await requireAccess(request, config.view);
  if (guard.response) return guard.response;
  const value = await db[config.model].findUnique({ where: { id } });
  return value ? ok(value) : error("NOT_FOUND", "Resource not found", 404);
}

export async function updateResource(request: Request, id: string, config: CrudConfig) {
  const guard = await requireAccess(request, config.edit);
  if (guard.response) return guard.response;
  if (!(await requireLock(config.model, id, guard.user.id, request.headers.get("X-Record-Lock-Token")))) return error("LOCKED", "Active record lock required", 423);
  const parsed = await parseJson(request, config.update);
  if ("response" in parsed) return parsed.response;
  try {
    if (config.model === "user" || config.model === "role") {
      const current = await db[config.model].findUnique({ where: { id } });
      if (current?.isSystemProtected || (current?.isSystemRole && current?.code === "SUPER_ADMIN")) return error("FORBIDDEN", "System resource is protected", 403);
    }
    return ok(await db[config.model].update({ where: { id }, data: parsed.data }));
  } catch (caught) { return mapPrismaError(caught); }
}

export async function deleteResource(request: Request, id: string, config: CrudConfig) {
  const guard = await requireAccess(request, config.remove);
  if (guard.response) return guard.response;
  if (!(await requireLock(config.model, id, guard.user.id, request.headers.get("X-Record-Lock-Token")))) return error("LOCKED", "Active record lock required", 423);
  try {
    if (config.model === "user" || config.model === "role") {
      const current = await db[config.model].findUnique({ where: { id } });
      if (current?.isSystemProtected || (current?.isSystemRole && current?.code === "SUPER_ADMIN")) return error("FORBIDDEN", "System resource is protected", 403);
    }
    return ok(await db[config.model].delete({ where: { id } }));
  } catch (caught) { return mapPrismaError(caught); }
}
