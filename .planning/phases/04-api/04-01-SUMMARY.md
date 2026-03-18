---
phase: 04-api
plan: 01
subsystem: api
tags: [hono, openapi, middleware, jwt, auth0, scalar, drizzle, d1]

# Dependency graph
requires:
  - phase: 03-database-and-data-migration
    provides: Drizzle ORM schema with D1 bindings and migration infrastructure
provides:
  - OpenAPIHono app factory with typed Bindings and Variables
  - API key middleware with timing-safe comparison
  - JWT auth middleware for Auth0 JWKS validation
  - Error handler middleware with structured error responses
  - OpenAPI 3.1 spec at /doc and Scalar UI at /scalar
  - EVENT_TYPES constant and EventType type in @dt65/shared
  - usersToEvents.joined_at column for participation ordering
affects: [04-api, 05-frontend]

# Tech tracking
tech-stack:
  added: ["@hono/zod-openapi@1.2.2", "@scalar/hono-api-reference@0.10.3", "hono@4.12.8 (upgraded from 4.7.5)"]
  patterns: ["OpenAPIHono app factory", "typed middleware with createMiddleware<AppEnv>", "hono/jwk for Auth0 JWKS", "timing-safe API key comparison"]

key-files:
  created:
    - apps/api/src/app.ts
    - apps/api/src/middleware/api-key.ts
    - apps/api/src/middleware/auth.ts
    - apps/api/src/middleware/error-handler.ts
    - packages/shared/src/constants.ts
    - apps/api/drizzle/0001_mushy_mother_askani.sql
  modified:
    - apps/api/src/index.ts
    - apps/api/package.json
    - apps/api/wrangler.jsonc
    - apps/api/tsconfig.json
    - apps/api/vite.config.ts
    - packages/shared/src/index.ts
    - pnpm-workspace.yaml
    - knip.json

key-decisions:
  - "Upgraded hono from 4.7.5 to 4.12.8 to satisfy @scalar/hono-api-reference peer dependency"
  - "Used wrapper middleware pattern for JWT auth to access env vars at request time (hono/jwk verification options are static)"
  - "Removed includeEntryExports from knip shared config since shared package is a library with intentional barrel exports"
  - "Used constant default empty string in migration for joined_at NOT NULL column (SQLite rejects datetime function defaults in ALTER TABLE)"

patterns-established:
  - "AppEnv type: { Bindings: Bindings; Variables: Variables } for typed Hono context"
  - "Middleware factory pattern: export const middleware = () => createMiddleware<AppEnv>(...)"
  - "Error response format: { error: { code: string, message: string, details?: array } }"
  - "biome-ignore for barrel files at package entry points"

requirements-completed: [INFR-07]

# Metrics
duration: 10min
completed: 2026-03-18
---

# Phase 4 Plan 01: API Foundation Summary

**OpenAPIHono app with api-key and JWT auth middleware, Scalar docs UI, and EVENT_TYPES constant with joined_at schema migration**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-18T06:02:43Z
- **Completed:** 2026-03-18T06:12:32Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- OpenAPIHono replaces plain Hono with typed Bindings (D1Database, Auth0 config, API key) and Variables (jwtPayload)
- Middleware stack: api-key validation with timing-safe comparison on /api/*, JWT auth via hono/jwk for Auth0 JWKS
- OpenAPI 3.1 spec at /doc, Scalar interactive UI at /scalar, health check at /
- EVENT_TYPES constant (15 event types) and EventType type exported from @dt65/shared
- usersToEvents.joined_at column added via Drizzle migration for participation ordering

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, add shared constants, and migrate schema** - `281365d` (feat)
2. **Task 2: Create OpenAPIHono app with middleware stack, Scalar docs, and entry point** - `0674a4c` (feat)

## Files Created/Modified
- `apps/api/src/app.ts` - OpenAPIHono app factory with typed Bindings and Variables
- `apps/api/src/middleware/api-key.ts` - API key validation with timing-safe comparison
- `apps/api/src/middleware/auth.ts` - Auth0 JWT validation via hono/jwk middleware
- `apps/api/src/middleware/error-handler.ts` - Global error and not-found handlers
- `apps/api/src/index.ts` - Entry point with middleware stack, OpenAPI docs, Scalar UI
- `packages/shared/src/constants.ts` - EVENT_TYPES array and EventType type
- `packages/shared/src/index.ts` - Barrel re-export with biome-ignore for noBarrelFile
- `apps/api/drizzle/0001_mushy_mother_askani.sql` - Migration adding joined_at column
- `apps/api/wrangler.jsonc` - Added AUTH0_DOMAIN and AUTH0_AUDIENCE vars
- `apps/api/package.json` - Added @hono/zod-openapi and @scalar/hono-api-reference deps
- `apps/api/tsconfig.json` - Added worker-configuration.d.ts to include
- `apps/api/vite.config.ts` - Added @/ path alias for build resolution
- `pnpm-workspace.yaml` - Added hono, @scalar/hono-api-reference to catalog, bumped @hono/zod-openapi
- `knip.json` - Removed includeEntryExports for shared package

## Decisions Made
- Upgraded hono from 4.7.5 to 4.12.8 because @scalar/hono-api-reference requires hono@^4.12.5 as peer dependency
- Used wrapper middleware pattern for JWT auth: hono/jwk verification options (iss, aud) accept only static values, so we create the middleware at request time to access c.env
- Removed knip includeEntryExports for shared package since it is a library -- its exports are consumed by other workspaces, and new exports (EVENT_TYPES) are intentionally prepared for Plan 02
- Used empty string default for joined_at migration because SQLite does not support non-constant defaults (like datetime('now')) in ALTER TABLE statements; the application layer will set the value on insert

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hono peer dependency version mismatch**
- **Found during:** Task 1 (dependency installation)
- **Issue:** @scalar/hono-api-reference@0.10.3 requires hono@^4.12.5 but project had 4.7.5
- **Fix:** Upgraded hono to 4.12.8 in pnpm catalog, switched package.json to catalog: protocol
- **Files modified:** pnpm-workspace.yaml, apps/api/package.json
- **Verification:** pnpm install completes without peer dependency warnings for hono
- **Committed in:** 281365d (Task 1 commit)

**2. [Rule 3 - Blocking] SQLite rejects non-constant DEFAULT in ALTER TABLE**
- **Found during:** Task 1 (migration application)
- **Issue:** Generated migration used DEFAULT (datetime('now')) which SQLite rejects for ALTER TABLE
- **Fix:** Changed to DEFAULT '' (empty string constant) for existing rows; app layer sets value on insert
- **Files modified:** apps/api/drizzle/0001_mushy_mother_askani.sql
- **Verification:** wrangler d1 migrations apply succeeds locally
- **Committed in:** 281365d (Task 1 commit)

**3. [Rule 1 - Bug] Biome noBarrelFile error on shared package index.ts**
- **Found during:** Task 1 (pre-commit hook)
- **Issue:** Moving DT65_APP_NAME to constants.ts and re-exporting triggered noBarrelFile lint error
- **Fix:** Added biome-ignore comment since index.ts is intentionally the package entry point barrel
- **Files modified:** packages/shared/src/index.ts
- **Verification:** biome check passes
- **Committed in:** 281365d (Task 1 commit)

**4. [Rule 3 - Blocking] worker-configuration.d.ts not in tsconfig include**
- **Found during:** Task 2 (typecheck)
- **Issue:** D1Database type not found because worker-configuration.d.ts was not included in tsconfig
- **Fix:** Added worker-configuration.d.ts to tsconfig.json include array and regenerated types
- **Files modified:** apps/api/tsconfig.json, apps/api/worker-configuration.d.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 0674a4c (Task 2 commit)

**5. [Rule 3 - Blocking] Vite build fails resolving @/ path alias**
- **Found during:** Task 2 (build verification)
- **Issue:** @/ path alias configured in tsconfig but not in vite.config.ts resolve.alias
- **Fix:** Added '@': path.resolve(import.meta.dirname, 'src') to vite resolve aliases
- **Files modified:** apps/api/vite.config.ts
- **Verification:** pnpm --filter @dt65/api build succeeds
- **Committed in:** 0674a4c (Task 2 commit)

**6. [Rule 3 - Blocking] Knip flags unused EVENT_TYPES and EventType exports**
- **Found during:** Task 2 (pnpm check)
- **Issue:** includeEntryExports: true in knip config flagged new shared exports not yet consumed
- **Fix:** Removed includeEntryExports from shared package knip config (library pattern)
- **Files modified:** knip.json
- **Verification:** pnpm knip passes cleanly
- **Committed in:** 0674a4c (Task 2 commit)

---

**Total deviations:** 6 auto-fixed (1 bug, 5 blocking)
**Impact on plan:** All auto-fixes necessary for correct builds and type safety. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OpenAPIHono app ready for route registration (Plan 02: event CRUD endpoints)
- Middleware stack in place: api-key on /api/*, JWT auth on /api/*
- EVENT_TYPES available from @dt65/shared for Zod schema validation
- joined_at column ready for participation tracking
- All quality checks pass (lint, typecheck, knip, sherif, build)

---
*Phase: 04-api*
*Completed: 2026-03-18*
