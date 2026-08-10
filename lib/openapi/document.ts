import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
const errorSchema = registry.register("Error", z.object({ error: z.object({ code: z.string(), message: z.string() }) }));
const auth = registry.registerComponent("securitySchemes", "bearerAuth", { type: "http", scheme: "bearer", bearerFormat: "JWT" });
registry.registerComponent("securitySchemes", "cookieAuth", { type: "apiKey", in: "cookie", name: "authjs.session-token", description: "Auth.js HttpOnly session cookie" });
void auth;
registry.registerPath({ method: "get", path: "/api/v1/health", responses: { 200: { description: "Healthy" } } });
for (const path of ["users", "roles", "organizations", "features"]) registry.registerPath({ method: "get", path: `/api/v1/${path}`, security: [{ bearerAuth: [] }], responses: { 200: { description: `${path} list` }, 401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } }, 403: { description: "Forbidden", content: { "application/json": { schema: errorSchema } } } } });
registry.registerPath({ method: "get", path: "/api/v1/integrations/restful-api-dev/objects", security: [{ bearerAuth: [] }], responses: { 200: { description: "Provider objects" }, 502: { description: "Provider failure" }, 504: { description: "Provider timeout" } } });
export function getOpenApiDocument() { return new OpenApiGeneratorV31(registry.definitions).generateDocument({ openapi: "3.1.0", info: { title: "Next Starter Admin API", version: "1.0.0" }, servers: [{ url: "/" }] }); }
