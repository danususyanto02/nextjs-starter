# Task 04 - RBAC and API Core

## Scope

- Add standardized API response and error helpers.
- Add Zod request validation helpers.
- Add API authentication resolving either Auth.js session or bearer token.
- Implement effective permission service: direct user roles plus all organization roles.
- Implement `hasAccess` and `requireAccess` server guards.
- Protect `SUPER_ADMIN` account and system role.
- Build CRUD APIs for users, roles, organizations, features, role/permission assignments, user/role assignments, organization roles, and memberships.
- Generate four permissions atomically when creating feature.
- Use Prisma transactions for every multi-table mutation.

## Acceptance Criteria

- `SUPER_ADMIN` bypasses all permission checks.
- Authenticated user can enter dashboard but cannot call protected feature APIs without matching permission.
- User permissions include all organization-derived roles without duplicates.
- Feature creation creates exactly four permission codes and assigns them to `SUPER_ADMIN` in one transaction.
- Failed multi-table mutation leaves no partial records.
- Protected API returns standard 401, 403, 404, 409, and 422 responses as applicable.
