import { error, ok, okPage } from "@/lib/api/response";
import { parseListQuery } from "@/lib/api/pagination";
import { externalService } from "@/lib/integrations/restful-api-dev/service";
import { ProviderError, ProviderTimeoutError } from "@/lib/integrations/http-client";
import { requireAccess } from "@/lib/rbac/guards";

type ExternalObject = { id: string; name: string; data?: Record<string, unknown> };

function map(caught: unknown) { if (caught instanceof ProviderTimeoutError) return error("PROVIDER_TIMEOUT", "External provider timed out", 504); if (caught instanceof ProviderError) return error("PROVIDER_ERROR", "External provider request failed", 502); return error("PROVIDER_ERROR", "External provider request failed", 502); }
function value(object: ExternalObject, sortBy: string) { if (sortBy === "data") return JSON.stringify(object.data ?? {}); return object[sortBy as "id" | "name"] ?? ""; }

export async function GET(request: Request) {
  const guard = await requireAccess(request, "AM0000007");
  if (guard.response) return guard.response;
  const parsed = parseListQuery(request, ["id", "name", "data"], { sortBy: "id", sortDirection: "asc" });
  if ("response" in parsed) return parsed.response;
  try {
    const { limit, offset, search, sortBy, sortDirection } = parsed.data;
    const normalizedSearch = search.toLocaleLowerCase();
    const filtered = (await externalService.list() as ExternalObject[]).filter((object) => !normalizedSearch || [object.id, object.name, JSON.stringify(object.data ?? {})].some((item) => item.toLocaleLowerCase().includes(normalizedSearch)));
    const sorted = filtered.map((object, index) => ({ object, index })).sort((left, right) => {
      const order = String(value(left.object, sortBy)).localeCompare(String(value(right.object, sortBy)), undefined, { numeric: true, sensitivity: "base" });
      return order === 0 ? left.index - right.index : sortDirection === "asc" ? order : -order;
    }).map(({ object }) => object);
    return okPage(sorted.slice(offset, offset + limit), { limit, offset, total: sorted.length });
  } catch (caught) { return map(caught); }
}

export async function POST(request: Request) { const guard = await requireAccess(request, "AD0000007"); if (guard.response) return guard.response; try { return ok(await externalService.create(await request.json()), { status: 201 }); } catch (caught) { return map(caught); } }
