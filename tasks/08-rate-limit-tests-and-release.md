# Task 08 - Rate Limits, Tests, and Release

## Scope

- Implement PostgreSQL-backed rate limiter.
- Apply default limits to auth, protected API, docs, and refresh endpoints.
- Add optional Vitest unit test configuration and tests.
- Complete README setup, migrations, seed, Docker, Swagger, RBAC, locking, and integration documentation.
- Run final static validation and Docker verification.

## Test Policy

- Tests are manual support tooling only.
- `npm run dev`, `npm run build`, and Docker build do not execute tests.
- Tests use mocks or in-memory fixtures. No configured external database or provider calls.

## Required Test Areas

- RBAC effective permission and super-admin bypass/protection.
- Access-code generation.
- Public registration toggle.
- Access/refresh token issuance, rotation, revocation, expiry, and disabled user handling.
- Rate-limit windows and 429 response.
- Prisma transaction rollback paths.
- Record lock concurrency, expiry, heartbeat, force unlock, and disabled settings.
- External provider client error, timeout, validation, and secret non-disclosure.

## Acceptance Criteria

- Rate limit defaults follow specification and return `429` plus `Retry-After`.
- `RATE_LIMIT_ENABLED=false` disables limiter for development.
- `npm run test` and `npm run test:watch` work independently from build workflows.
- `npm run build` succeeds.
- Docker image builds and health endpoint responds.
- README contains no real secret values.
