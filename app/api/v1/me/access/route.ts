import { ok } from "@/lib/api/response";
import { unauthorized } from "@/lib/api/bearer";
import { resolveApiUser } from "@/lib/api/bearer";
import { getEffectivePermissions } from "@/lib/rbac/permissions";

export async function GET(request: Request) {
  const user = await resolveApiUser(request); if (!user) return unauthorized();
  const permissions = await getEffectivePermissions(user.id); return ok({ roles: [...permissions.roleCodes], permissions: [...permissions.codes] });
}
