import { resolveApiUser, unauthorized } from "@/lib/api/bearer"; import { error, ok } from "@/lib/api/response";
export async function GET(request: Request) { const user = await resolveApiUser(request); if (!user) return unauthorized(); return ok({ id: user.id, username: user.username, displayName: user.displayName, email: user.email, status: user.status }); }
