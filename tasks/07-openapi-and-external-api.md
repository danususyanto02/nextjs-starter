# Task 07 - OpenAPI and External API

## Scope

- Register Zod API schemas with OpenAPI registry.
- Generate OpenAPI 3.1 JSON at `/api/openapi.json`.
- Add Swagger UI at `/api/docs` with bearer and cookie auth descriptions.
- Document every API route, required access code, request/response schemas, and error states.
- Implement `lib/integrations/restful-api-dev` server-side sample client.
- Implement internal proxy CRUD endpoints for provider object collection.
- Add External API Demo dashboard page and RBAC feature.

## Integration Rules

- Use API key only in server-side `x-api-key` header.
- Do not leak provider key through API response, client bundle, Swagger examples, or logs.
- Apply 10 second timeout, `no-store`, Zod provider-response validation, and error mapping.
- Mock provider HTTP in tests.

## Acceptance Criteria

- Swagger accurately describes deployed internal API, including bearer authentication.
- External demo browser calls internal `/api/v1/integrations/...` endpoints only.
- Provider failure maps to appropriate 502 or 504 response without secret leak.
- External API feature has seeded AM/AD/ED/DD permissions.
