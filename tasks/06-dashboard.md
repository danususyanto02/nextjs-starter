# Task 06 - Dashboard

## Scope

- Create dashboard shell, navigation, and authenticated layout.
- Implement permission-filtered sidebar using AM codes.
- Implement `Button` with `CodeAccess` prop.
- Implement `Access` conditional component.
- Build CRUD pages for User, Role, Organization, Feature, and Locked Records.
- Add forms for role permissions, user roles, organization roles, and membership assignments.
- Integrate record-lock state into every input-capable admin detail/edit page.
- Add direct route 403 behavior.

## Acceptance Criteria

- All authenticated users access dashboard landing page.
- Sidebar hides inaccessible menu features.
- Direct page access is blocked when user lacks menu permission.
- Mutating controls are hidden/disabled when missing RBAC permission or record lock.
- API still rejects unauthorized or unlocked mutations even if UI is bypassed.
- Super-admin protected resources cannot be deleted, disabled, or downgraded in UI.
