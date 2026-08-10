# Task 02 - Database and Seed

## Scope

- Configure Prisma PostgreSQL using only `DATABASE_URL`.
- Create all models described in `docs/starter-kit-spec.md`.
- Add unique constraints and indexes needed for permission codes, refresh tokens, rate limits, and locks.
- Create Prisma migrations.
- Create idempotent seed script.

## Seed Data

- System roles: `SUPER_ADMIN`, `ADMIN`, `USER`.
- Super-admin account from `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD`.
- Initial menu features: Dashboard, User Management, Role Management, Organization Management, Menu/Feature Management, Locked Records, External API Demo.
- Four permissions per feature using AM/AD/ED/DD code format.
- Every seeded permission assigned to `SUPER_ADMIN`.
- Record locking enabled globally and for administrative features by default.

## Acceptance Criteria

- `prisma migrate deploy` applies from clean database.
- Seed runs repeatedly without duplicate system records or duplicate permissions.
- Password seed uses Argon2 hash.
- Every listed model has `createdAt` and `updatedAt`.
- `RecordLock` has unique `[resourceType, resourceId]` constraint.
- Permission code collisions fail safely.
