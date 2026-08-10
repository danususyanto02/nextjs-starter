# Starter Kit Tasks

Implementation order is intentional. Complete each task and its acceptance criteria before moving to next task.

| Task | Scope | Depends on |
| --- | --- | --- |
| [01-foundation.md](01-foundation.md) | Next.js, FlyonUI, environment, Docker baseline | None |
| [02-database-and-seed.md](02-database-and-seed.md) | Prisma schema, migrations, seed data | 01 |
| [03-auth-and-tokens.md](03-auth-and-tokens.md) | Auth.js, web sessions, mobile tokens | 02 |
| [04-rbac-and-api-core.md](04-rbac-and-api-core.md) | Permissions, API framework, CRUD endpoints | 03 |
| [05-record-locking.md](05-record-locking.md) | Lock table, lifecycle, UI read-only handling | 04 |
| [06-dashboard.md](06-dashboard.md) | Dashboard pages, CRUD UI, RBAC components | 04, 05 |
| [07-openapi-and-external-api.md](07-openapi-and-external-api.md) | Swagger, OpenAPI, external API sample | 04, 06 |
| [08-rate-limit-tests-and-release.md](08-rate-limit-tests-and-release.md) | Rate limits, optional tests, deployment verification | 02, 03, 04, 05, 07 |

Task files describe target behavior. They do not contain secrets.
