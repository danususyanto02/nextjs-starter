import { resolveApiUser, unauthorized } from "@/lib/api/bearer";
import { okPage } from "@/lib/api/response";
import { parseListQuery } from "@/lib/api/pagination";
import { listLocks } from "@/lib/locks/service";

export async function GET(request: Request) {
  const user = await resolveApiUser(request);
  if (!user) return unauthorized();
  void user;
  const parsed = parseListQuery(request, ["acquiredAt", "expiresAt", "resourceType", "resourceId"], { sortBy: "acquiredAt", sortDirection: "desc" });
  if ("response" in parsed) return parsed.response;
  const page = await listLocks(parsed.data);
  return okPage(page.data, page.meta);
}
