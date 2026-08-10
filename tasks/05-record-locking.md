# Task 05 - Record Locking

## Scope

- Implement `RecordLock` table access service and lock endpoints.
- Add global `SystemSetting.recordLockEnabled` and per-feature `recordLockEnabled` evaluation.
- Implement transactional acquire, status, heartbeat, release, list, and force-release operations.
- Require `X-Record-Lock-Token` for enabled feature mutations.
- Add `useRecordLock` client hook with acquire, heartbeat, pagehide release, custom Back release, and read-only state.
- Add Locked Records feature API support.

## Behavior

- Input-capable detail and edit pages acquire lock. Pure read pages do not.
- Lock TTL: 120 seconds. Heartbeat: 30 seconds.
- Same user in second tab is read-only.
- Other users are read-only while valid lock exists.
- `SUPER_ADMIN` and users with Locked Records `DD` permission can force unlock.
- Force unlock deletes lock only, never resource.

## Acceptance Criteria

- Concurrent acquire permits one owner only due to database unique constraint.
- Invalid, expired, absent, or foreign lock token causes 423 for enabled mutations.
- Global disable or feature disable bypasses lock requirement.
- Expired lock can be acquired by another user.
- Logout releases user locks.
- Force unlock requires correct permission.
