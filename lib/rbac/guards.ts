import { error } from "@/lib/api/response";
import { resolveApiUser } from "@/lib/api/bearer";
import { hasAccess } from "@/lib/rbac/permissions";
import { enforceRateLimit } from "@/lib/rate-limit/request";
import { rateLimitConfig } from "@/lib/rate-limit/config";

export async function requireAccess(request: Request, code: string) {
  const user = await resolveApiUser(request);
  if (!user) return { response: error("UNAUTHORIZED", "Authentication required", 401) };
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limited = await enforceRateLimit(`api:${user.id || ip}`, ...rateLimitConfig.api);
  if (limited) return { response: limited };
  if (!(await hasAccess(user.id, code))) return { response: error("FORBIDDEN", "Permission required", 403) };
  return { user };
}
