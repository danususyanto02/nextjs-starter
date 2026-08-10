# Task 03 - Auth and Tokens

## Scope

- Implement Auth.js Credentials provider for username/password web login.
- Implement login and registration UI.
- Respect `PUBLIC_REGISTRATION_ENABLED`.
- Implement mobile `register`, `login`, `refresh`, `logout`, and `me` endpoints.
- Add JWT access token issuance and verification.
- Add opaque refresh token hashing, rotation, revocation, and expiry handling.
- Revoke tokens and record locks on logout; revoke tokens after sensitive user changes.
- Add dashboard route protection.

## Acceptance Criteria

- Web login stores only HttpOnly session cookie.
- No web token is stored in browser storage.
- Mobile login receives access and refresh tokens.
- Reusing rotated refresh token fails.
- Disabled user and invalid credentials return safe generic authentication errors.
- Registration fails when public registration is disabled.
- Production configuration rejects default super-admin password.
