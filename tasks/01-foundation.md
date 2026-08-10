# Task 01 - Foundation

## Scope

- Initialize Next.js App Router with TypeScript.
- Add Tailwind CSS 4 and FlyonUI integration.
- Add root layout, global CSS, loading/error/not-found pages, and base metadata.
- Add server environment validation and `.env.example` placeholders.
- Add `.gitignore` and `.dockerignore` protecting secret and build files.
- Configure `next.config.ts` with standalone output, security headers, and health-log exclusion when applicable.
- Add multi-stage non-root Dockerfile and app-only `docker-compose.yml`.
- Add `GET /api/v1/health` endpoint.

## Acceptance Criteria

- `npm run dev` starts application.
- FlyonUI classes and JavaScript initialization work in App Router.
- `npm run build` creates standalone output.
- Docker build contains no `.env` file.
- Docker runtime runs as non-root and uses external `DATABASE_URL`.
- Health endpoint returns success without database mutation.
- Production environment validation rejects default super-admin password and weak/missing secrets.
