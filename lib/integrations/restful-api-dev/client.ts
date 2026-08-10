import { providerFetch } from "@/lib/integrations/http-client";
import { objectListSchema, objectSchema } from "@/lib/integrations/restful-api-dev/schemas";
import type { RestfulObject } from "@/lib/integrations/restful-api-dev/types";

function config() { return { baseUrl: process.env.RESTFUL_API_DEV_BASE_URL ?? "https://api.restful-api.dev", apiKey: process.env.RESTFUL_API_DEV_API_KEY }; }
function init(method = "GET", body?: unknown): RequestInit { const { apiKey } = config(); return { method, headers: { "content-type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }; }
export const restfulApiDevClient = {
  list: () => { const { baseUrl } = config(); return providerFetch<RestfulObject[]>(`${baseUrl}/objects`, init(), 10000, (value) => objectListSchema.parse(value)); },
  get: (id: string) => { const { baseUrl } = config(); return providerFetch<RestfulObject>(`${baseUrl}/objects/${encodeURIComponent(id)}`, init(), 10000, (value) => objectSchema.parse(value)); },
  create: (body: unknown) => { const { baseUrl } = config(); return providerFetch<RestfulObject>(`${baseUrl}/objects`, init("POST", body), 10000, (value) => objectSchema.parse(value)); },
  update: (id: string, body: unknown, method: "PUT" | "PATCH" = "PUT") => { const { baseUrl } = config(); return providerFetch<RestfulObject>(`${baseUrl}/objects/${encodeURIComponent(id)}`, init(method, body), 10000, (value) => objectSchema.parse(value)); },
  remove: async (id: string) => { const { baseUrl } = config(); await providerFetch(`${baseUrl}/objects/${encodeURIComponent(id)}`, init("DELETE"), 10000); }
};
