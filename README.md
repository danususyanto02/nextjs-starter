# Next Starter Admin

Production-oriented Next.js App Router starter kit with PostgreSQL, Prisma, Auth.js Credentials sessions, mobile bearer tokens, RBAC, record locking, OpenAPI 3.1, external API proxy, persistent rate limiting, and Docker standalone deployment.

## Setup

1. Copy `.env.example` to `.env` and replace every placeholder through local secret storage.
2. Install dependencies: `npm install`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Apply migrations: `npm run prisma:migrate`.
5. Seed local system roles and features: `npm run prisma:seed`.
6. Start development: `npm run dev`.

Application reads server credentials only from environment variables. Never commit `.env`, provider keys, database URLs, JWT secrets, or production passwords. PostgreSQL remains external to Docker and is configured through `DATABASE_URL`.

## Security

Dashboard uses Auth.js HttpOnly cookies. Mobile clients use short-lived JWT access tokens and rotated opaque refresh tokens. Passwords and refresh tokens are hashed. Permission checks query current database state. `SUPER_ADMIN` and its seed account are protected. Production rejects weak secrets, HTTP `NEXTAUTH_URL`, and default `superadmin` password.

## API

- Health: `GET /api/v1/health`
- OpenAPI: `GET /api/openapi.json`
- Docs: `GET /api/docs`
- Auth: `/api/v1/auth/register`, `/login`, `/refresh`, `/logout`
- Resources: `/api/v1/users`, `/roles`, `/organizations`, `/features`
- Locks: `/api/v1/locks`
- External proxy: `/api/v1/integrations/restful-api-dev/objects`

## Verification

`npm run test` runs isolated unit tests. `npm run test:watch` runs watch mode. Tests must not connect to configured PostgreSQL or external provider. `npm run build` and Docker build do not run tests.

## Docker

`docker compose up --build` runs only application container as non-root on port 3000. Runtime environment supplies `DATABASE_URL`, auth secrets, and provider configuration. Health check calls `/api/v1/health`.
