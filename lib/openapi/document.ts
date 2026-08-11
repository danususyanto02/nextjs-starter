import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
const errorSchema = registry.register("Error", z.object({ error: z.object({ code: z.string(), message: z.string() }) }));
const pageMetaSchema = registry.register("PageMeta", z.object({ limit: z.number().int().min(1).max(100), offset: z.number().int().min(0), total: z.number().int().min(0) }));
const pagedListSchema = registry.register("PagedList", z.object({ data: z.array(z.unknown()), meta: pageMetaSchema }));
const listParameters = [
  { name: "limit", in: "query" as const, required: false, schema: z.number().int().min(1).max(100).default(25), description: "Rows per page" },
  { name: "offset", in: "query" as const, required: false, schema: z.number().int().min(0).default(0), description: "Zero-based row offset" },
  { name: "search", in: "query" as const, required: false, schema: z.string().max(100), description: "Case-insensitive search" },
  { name: "sortBy", in: "query" as const, required: false, schema: z.string(), description: "Endpoint-allowed sort field" },
  { name: "sortDirection", in: "query" as const, required: false, schema: z.enum(["asc", "desc"]), description: "Sort direction" }
];
const auth = registry.registerComponent("securitySchemes", "bearerAuth", { type: "http", scheme: "bearer", bearerFormat: "JWT" });
registry.registerComponent("securitySchemes", "cookieAuth", { type: "apiKey", in: "cookie", name: "authjs.session-token", description: "Auth.js HttpOnly session cookie" });
void auth;
registry.registerPath({ method: "get", path: "/api/v1/health", responses: { 200: { description: "Healthy" } } });
for (const path of ["users", "roles", "organizations", "features"]) registry.registerPath({ method: "get", path: `/api/v1/${path}`, security: [{ bearerAuth: [] }], request: { query: z.object({ limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional(), search: z.string().max(100).optional(), sortBy: z.string().optional(), sortDirection: z.enum(["asc", "desc"]).optional() }) }, responses: { 200: { description: `${path} paginated list`, content: { "application/json": { schema: pagedListSchema } } }, 401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } }, 403: { description: "Forbidden", content: { "application/json": { schema: errorSchema } } }, 422: { description: "Invalid list query", content: { "application/json": { schema: errorSchema } } } } });
registry.registerPath({ method: "get", path: "/api/v1/integrations/restful-api-dev/objects", security: [{ bearerAuth: [] }], request: { query: z.object({ limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional(), search: z.string().max(100).optional(), sortBy: z.enum(["id", "name", "data"]).optional(), sortDirection: z.enum(["asc", "desc"]).optional() }) }, responses: { 200: { description: "Provider objects, paginated from a server-side provider snapshot", content: { "application/json": { schema: pagedListSchema } } }, 502: { description: "Provider failure" }, 504: { description: "Provider timeout" }, 422: { description: "Invalid list query", content: { "application/json": { schema: errorSchema } } } } });
void listParameters;
export function getOpenApiDocument() { return new OpenApiGeneratorV31(registry.definitions).generateDocument({ openapi: "3.1.0", info: { title: "Next Starter Admin API", version: "1.0.0" }, servers: [{ url: "/" }] }); }
