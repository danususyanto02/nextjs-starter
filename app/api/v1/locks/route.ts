import { resolveApiUser, unauthorized } from "@/lib/api/bearer"; import { ok } from "@/lib/api/response"; import { listLocks } from "@/lib/locks/service";
export async function GET(request: Request) { const user = await resolveApiUser(request); if (!user) return unauthorized(); return ok(await listLocks()); }
