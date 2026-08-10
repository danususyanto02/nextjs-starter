# Next Starter Admin - Implementation Specification

## Purpose

Production-oriented Next.js starter kit for a web dashboard and mobile-ready REST API. It provides username/password authentication, PostgreSQL persistence, RBAC, menu-based permissions, record locking, OpenAPI documentation, external API integration patterns, and Docker deployment.

## Non-Negotiable Security Rules

- Do not commit `.env` files, database URLs, API keys, JWT secrets, or production passwords.
- Keep server credentials in environment variables without `NEXT_PUBLIC_` prefix.
- Browser dashboard must not store access tokens in `localStorage` or `sessionStorage`.
- Dashboard session uses Auth.js `HttpOnly` cookies, `Secure` in production, and `SameSite=Lax`.
- Mobile clients use bearer access tokens and opaque refresh tokens stored in OS secure storage.
- Passwords use Argon2 hashes. Never persist plaintext passwords.
- Refresh tokens are stored only as hashes and rotate on refresh.
- Seed account `superadmin/superadmin` exists only for local development. Production startup must reject this default password.
- Rotate all credentials previously shared outside local secret storage before production use.

## Technology

- Next.js App Router and TypeScript.
- Tailwind CSS 4 and FlyonUI.
- PostgreSQL through Prisma.
- Auth.js Credentials provider for dashboard web sessions.
- Zod for API validation.
- `@asteasolutions/zod-to-openapi` and Swagger UI for OpenAPI 3.1 documentation.
- Argon2 for password and opaque-token hashing.
- Vitest for optional unit tests.
- Docker multi-stage deployment using Next.js `output: "standalone"`.

## Configuration

Use one replaceable PostgreSQL connection string. Application code must only read `DATABASE_URL`.

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=disable"
AUTH_SECRET="replace-with-long-random-secret"
JWT_SECRET="replace-with-different-long-random-secret"
PUBLIC_REGISTRATION_ENABLED=true
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=superadmin
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_SECONDS=900
RATE_LIMIT_REGISTER_MAX=5
RATE_LIMIT_REGISTER_WINDOW_SECONDS=3600
RATE_LIMIT_API_MAX=120
RATE_LIMIT_API_WINDOW_SECONDS=60
RESTFUL_API_DEV_BASE_URL=https://api.restful-api.dev
RESTFUL_API_DEV_API_KEY="replace-with-provider-key"
```

Required production validation:

- Reject missing or weak `AUTH_SECRET` and `JWT_SECRET`.
- Reject `SUPER_ADMIN_PASSWORD=superadmin` when `NODE_ENV=production`.
- Require HTTPS-compatible runtime configuration in production.
- Keep `.env` out of Git and provide placeholders only in `.env.example`.

## Authentication

### Dashboard Web

- Login uses username and password through Auth.js Credentials provider.
- Auth.js session is cookie-based for browser dashboard requests.
- All authenticated users can access `/dashboard`.
- Public registration starts enabled and is controlled by `PUBLIC_REGISTRATION_ENABLED`.
- Disabled public registration returns a consistent error and hides or blocks registration UI.

### Mobile and External Clients

Use versioned API endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/me/access
```

- Login returns a JWT access token, opaque refresh token, `tokenType: "Bearer"`, and expiry metadata.
- Access token lifetime: 15 minutes.
- Refresh token lifetime: 30 days.
- Refresh tokens rotate atomically. Old token is revoked when replacement token is created.
- Logout, disabled user, password change, and user removal revoke user refresh tokens.
- All `/api/v1` protected resource endpoints accept `Authorization: Bearer <access-token>`.
- Permission must be queried from database for every protected request. JWT claims are not permanent permission authority.

## RBAC

### Roles

System roles:

- `SUPER_ADMIN`
- `ADMIN`
- `USER`

Additional roles are managed through role CRUD.

`SUPER_ADMIN` bypasses permission checks. Its role and seed user cannot be deleted, disabled, or downgraded through the application UI or API.

### Permission Codes

Each menu feature generates four permissions. Format is prefix plus seven-digit feature sequence, nine characters total:

```text
AM0000001  View menu or feature
AD0000001  Add data
ED0000001  Edit data
DD0000001  Delete data
```

When a menu feature is created, its four permission records are generated atomically and assigned to `SUPER_ADMIN`.

### Effective Permissions

A user receives permissions from:

- Roles directly assigned to user.
- Roles assigned to every organization where user is a member.

User may belong to zero, one, or many organizations. Effective permissions are a duplicate-free union of all sources. There is no active organization selector.

### UI and Backend Enforcement

- Sidebar displays only menu features for which user has relevant `AM` permission.
- Direct route access without required permission returns a 403 page or API 403 response.
- API mutations require corresponding `AD`, `ED`, or `DD` permissions.
- UI checks are only presentation. API and server-side code always enforce access.
- UI `Button` accepts `CodeAccess?: string` and does not render or enables according to permission policy.
- UI `Access` accepts `CodeAccess` and conditionally renders children:

```tsx
<Access CodeAccess="ED0000002">
  <Button CodeAccess="ED0000002">Save</Button>
</Access>
```

Do not introduce a separate `AccessButton` component.

## Data Model

All business models and assignment relations include:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Core models:

- `User`: username, password hash, display details, status, system protection flag.
- `Role`: name, code, system-role marker, status.
- `Permission`: code, action (`MENU`, `ADD`, `EDIT`, `DELETE`), feature relation.
- `MenuFeature`: name, route path, icon, sort order, parent relation, status, system lock marker, `recordLockEnabled`.
- `UserRole`: direct user-to-role assignment.
- `RolePermission`: role-to-permission assignment.
- `Organization`: name, code, status.
- `OrganizationRole`: role assigned to organization.
- `OrganizationMember`: user membership in organization.
- `RefreshToken`: hashed token, expiry, revoke and replacement metadata.
- `RateLimitEntry`: persistent counter state.
- `SystemSetting`: global record locking settings.
- `RecordLock`: current lock state per resource record.

Prisma migrations and idempotent seed must create system roles, super admin, initial menu features, access codes, and `SUPER_ADMIN` permission assignments.

## Dashboard

Initial protected dashboard pages:

```text
/dashboard
/dashboard/users
/dashboard/roles
/dashboard/organizations
/dashboard/features
/dashboard/locked-records
/dashboard/external-api-demo
```

Functional scope:

- User CRUD, direct role assignment, active status management, and system-user protections.
- Role CRUD and role permission assignment.
- Organization CRUD, organization role assignment, and organization member management.
- Menu/feature CRUD with automatic access-code generation.
- Locked Records list and force unlock action.
- External API Demo CRUD through internal proxy endpoints.

## REST API

API resources use `/api/v1`. Dashboard can consume these endpoints; mobile clients use same contract.

```text
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
PUT    /api/v1/users/:id/roles

GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/:id
PATCH  /api/v1/roles/:id
DELETE /api/v1/roles/:id
PUT    /api/v1/roles/:id/permissions

GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
PUT    /api/v1/organizations/:id/roles
PUT    /api/v1/organizations/:id/members

GET    /api/v1/features
POST   /api/v1/features
GET    /api/v1/features/:id
PATCH  /api/v1/features/:id
DELETE /api/v1/features/:id

GET    /api/v1/locks
POST   /api/v1/locks/acquire
GET    /api/v1/locks/status
POST   /api/v1/locks/:id/heartbeat
DELETE /api/v1/locks/:id
DELETE /api/v1/locks/:id/force

GET    /api/v1/integrations/restful-api-dev/objects
POST   /api/v1/integrations/restful-api-dev/objects
GET    /api/v1/integrations/restful-api-dev/objects/:id
PUT    /api/v1/integrations/restful-api-dev/objects/:id
PATCH  /api/v1/integrations/restful-api-dev/objects/:id
DELETE /api/v1/integrations/restful-api-dev/objects/:id

GET    /api/v1/health
GET    /api/openapi.json
GET    /api/docs
```

Every route uses Zod input validation and consistent JSON error responses. Relevant status codes: `400`, `401`, `403`, `404`, `409`, `422`, `423`, `429`, `502`, and `504`.

## OpenAPI and Swagger

- Generate OpenAPI 3.1 document from Zod schemas using `@asteasolutions/zod-to-openapi`.
- Serve spec at `GET /api/openapi.json`.
- Serve interactive Swagger UI at `GET /api/docs`.
- Document cookie session auth and bearer auth schemes.
- Document required RBAC code, request schemas, response schemas, and standardized errors for each endpoint.
- Keep route validation and OpenAPI schemas in same source of truth.

## Transactions and Rollbacks

Use `prisma.$transaction()` for all multi-table mutations. Throwing inside callback rolls back automatically; successful callback commits automatically.

Transaction-required operations:

- Public registration and default `USER` role assignment.
- Admin user creation and initial role assignment.
- Password/status changes and refresh-token revocation.
- User deletion and related token/assignment cleanup.
- Menu feature creation, four permission creation, and `SUPER_ADMIN` assignment.
- Menu feature deletion and permission relation cleanup.
- Role-permission replacement.
- User-role and organization-role assignments.
- Organization membership changes.
- Refresh-token rotation.
- Record lock acquire, heartbeat, release, and force release when multiple queries apply.
- Persistent rate-limit counter update.

Use database constraints alongside transactions for correctness. Feature permission codes are unique. Record locks use a unique resource constraint.

External systems cannot participate in PostgreSQL transactions. For external create plus local persistence, use a compensating action such as provider delete if local transaction fails after external success. The initial external sample is proxy-only and has no local persistence after provider calls.

## Rate Limiting

Persist rate-limit state in PostgreSQL so it works across multiple Docker instances.

Default rules:

| Target | Limit | Key |
| --- | --- | --- |
| Login | 5 per 15 minutes | IP plus username |
| Register | 5 per hour | IP |
| Refresh | 20 per 15 minutes | IP plus refresh token |
| Protected API | 120 per minute | User ID, fallback IP |
| Health | Unrestricted | None |
| API docs/spec | 60 per minute | IP |

Exceeded limit returns `429 Too Many Requests` with `Retry-After` and error code `RATE_LIMITED`. `RATE_LIMIT_ENABLED=false` disables rate limiting for development.

## Record Locking

### Goal

Prevent concurrent input and mutation of same resource. Read-only views do not acquire locks. Any page or detail action that begins input, assignment, edit, delete, or another mutation must acquire a lock when locking is enabled for that feature.

### RecordLock Table

```prisma
model RecordLock {
  id            String   @id @default(cuid())
  resourceType  String
  resourceId    String
  lockTokenHash String
  ownerUserId   String
  acquiredAt    DateTime @default(now())
  heartbeatAt   DateTime @default(now())
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ownerUser User @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)

  @@unique([resourceType, resourceId])
  @@index([ownerUserId])
  @@index([expiresAt])
}
```

`@@unique([resourceType, resourceId])` is required to prevent two active editors from acquiring same record simultaneously. One user opening same record in a second tab also gets read-only mode.

### Lifecycle

- `POST /api/v1/locks/acquire` creates lock transactionally when no valid lock exists.
- `GET /api/v1/locks/status` returns lock state for frontend read-only handling.
- Server returns opaque plaintext lock token only once to lock owner. Database stores only its hash.
- Client keeps token only in page memory and sends `X-Record-Lock-Token` with mutations.
- Client sends heartbeat every 30 seconds.
- Lock TTL is 2 minutes.
- Custom Back button releases lock before navigation.
- `pagehide` uses best-effort release. Crashes, closed tabs, and network failures rely on TTL expiry.
- Logout releases all locks held by user.
- Other users can view resource while lock exists but inputs and mutating actions are read-only/disabled.
- Backend must return `423 Locked` for mutation without matching active lock token.

### Controls

- `SystemSetting.recordLockEnabled` controls global enable or disable.
- `MenuFeature.recordLockEnabled` controls per-feature enable or disable.
- Global off bypasses all lock checks.
- Global on plus feature off bypasses that resource lock check.
- Default enabled for User, Role, Organization, Feature/Menu, and related assignment mutations.

### Locked Records Menu

Feature `Locked Records` is seeded with standard AM/AD/ED/DD permissions.

- `AM`: show locked record list.
- `DD`: force unlock button.
- `AD` and `ED`: unused initially.

`SUPER_ADMIN` and users granted `DD` for `Locked Records` can force unlock. Force unlock deletes only `RecordLock`; it never deletes original resource data.

## External API Integration Sample

Provide server-side sample integration for `https://restful-api.dev/`.

Structure:

```text
lib/integrations/
  http-client.ts
  restful-api-dev/
    client.ts
    schemas.ts
    service.ts
    types.ts
```

Rules:

- Use `RESTFUL_API_DEV_API_KEY` only in server-side client as `x-api-key`.
- Apply timeout, no-store caching, provider error mapping, and Zod response validation.
- Browser and mobile clients call application proxy endpoints, never provider endpoint with provider key.
- Use authenticated provider collection such as `starter-demo` for sample CRUD.
- Seed `External API Demo` feature and its AM/AD/ED/DD permissions. Sequence value follows actual seed order.
- Dashboard page `/dashboard/external-api-demo` has list, JSON data form, create, edit, delete, loading, empty, timeout, and provider-error states.
- Include internal proxy routes in Swagger.
- Unit tests mock provider fetch; no test makes real provider request.
- Provider quota is suitable for demo/testing, not critical production workload.

## Unit Tests

Vitest is optional support tooling:

```text
npm run test
npm run test:watch
```

- Do not run tests during `npm run dev`, `npm run build`, or Docker image build.
- Use mocks or in-memory fixtures. Tests must not connect to configured PostgreSQL server or external provider.

Required coverage:

- Access-code generation and uniqueness.
- Direct and organization-derived effective permissions.
- `SUPER_ADMIN` bypass and protection against removal, downgrade, disable, or deletion.
- Public registration flag.
- Password and token login failures.
- Access-token expiry, refresh rotation, logout revocation, disabled user rejection, and permission change impact.
- Rate-limit counter, window reset, and `429` result.
- Transaction rollback behavior for registration, feature generation, and role assignments.
- Concurrent record lock acquire, heartbeat, expiry, release, force unlock permission, and `423` enforcement.
- Global and per-feature lock disable behavior.
- External integration client headers, timeout, invalid response, error mapping, and key non-disclosure.

## Docker Deployment

- Docker contains only Next.js application. PostgreSQL remains external and uses `DATABASE_URL`.
- Next.js configuration uses `output: "standalone"`.
- Use multi-stage Dockerfile.
- Runtime image contains only standalone output, static assets, required public assets, and generated Prisma client.
- Run as non-root user.
- Expose port 3000 with `HOSTNAME=0.0.0.0`.
- Add health check using `GET /api/v1/health`.
- `docker-compose.yml` contains application service only and reads runtime values from environment or `.env`.

## Folder Layout

```text
app/
  (auth)/
  (dashboard)/dashboard/
  api/auth/[...nextauth]/
  api/docs/
  api/openapi.json/
  api/v1/
components/
  auth/
  dashboard/
  features/
  organizations/
  roles/
  users/
  ui/
hooks/
  useRecordLock.ts
lib/
  api/
  auth/
  integrations/
  openapi/
  rate-limit/
  rbac/
  env.ts
  prisma.ts
prisma/
  migrations/
  schema.prisma
  seed.ts
tests/unit/
types/
docs/
tasks/
```
