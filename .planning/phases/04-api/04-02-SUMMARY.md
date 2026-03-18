---
phase: 04-api
plan: 02
subsystem: api
tags: [hono, openapi, zod, drizzle, d1, events, crud, authorization]

# Dependency graph
requires:
  - phase: 04-api-01
    provides: OpenAPIHono app factory, JWT auth middleware, API key middleware, EVENT_TYPES constant
provides:
  - Event CRUD endpoints (create, list, get detail, update, delete)
  - Zod OpenAPI schemas for event request/response validation
  - Drizzle event service layer with ownership authorization
  - Public GET /api/events/{id} endpoint (no JWT) for WhatsApp OG sharing
  - Selective JWT middleware pattern on events router
affects: [04-api, 05-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns: ["RouteHandler typed handlers with OpenAPI route definitions", "selective JWT middleware on sub-router", "Result type for service layer authorization", "EventType narrowing with as-cast from DB strings"]

key-files:
  created:
    - apps/api/src/routes/events/events.schemas.ts
    - apps/api/src/routes/events/events.routes.ts
    - apps/api/src/routes/events/events.handlers.ts
    - apps/api/src/routes/events/events.index.ts
    - apps/api/src/services/event-service.ts
  modified:
    - apps/api/src/index.ts

key-decisions:
  - "Selective JWT middleware on events sub-router instead of blanket /api/* to allow public GET /api/events/{id}"
  - "EventType as-cast from DB string since Drizzle schema uses text() not enum (validated at API layer via Zod)"
  - "Removed EventTypeSchema export (module-private) to satisfy knip dead code detection"
  - "Used explicit | undefined on optional service types for exactOptionalPropertyTypes compatibility"
  - "Extracted helper functions (findEventById, buildUpdateFields, toEventRow, getParticipantCount) to satisfy Biome complexity limits"

patterns-established:
  - "Service functions accept D1Database, create drizzle instance internally"
  - "Result type pattern: { ok: true, data } | { ok: false, error: 'FORBIDDEN' | 'NOT_FOUND' }"
  - "Handler pattern: RouteHandler<typeof route, AppEnv> with named imports from service"
  - "Sub-router pattern: OpenAPIHono<AppEnv> with selective middleware, mounted via app.route('/', router)"

requirements-completed: [EVNT-01, EVNT-02, EVNT-03, EVNT-06, EVNT-07]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 4 Plan 02: Event CRUD Endpoints Summary

**Five event CRUD endpoints with Zod OpenAPI validation, Drizzle service layer, ownership authorization, and public event detail for WhatsApp sharing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T06:15:28Z
- **Completed:** 2026-03-18T06:20:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- POST /api/events creates events with crypto.randomUUID(), validated by Zod OpenAPI schema
- GET /api/events lists upcoming events (dateStart >= today) ordered by date ASC with participant counts
- GET /api/events/{id} returns event detail with participant list (public, no JWT required)
- PUT /api/events/{id} and DELETE /api/events/{id} enforce ownership authorization (403 for non-owners)
- D1 boolean conversion: race field stored as 0/1, returned as true/false

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zod schemas, OpenAPI routes, and event service** - `da97eac` (feat)
2. **Task 2: Implement handlers, mount router, and wire public event detail** - `f28e9f5` (feat)

## Files Created/Modified
- `apps/api/src/routes/events/events.schemas.ts` - Zod OpenAPI schemas for CreateEvent, UpdateEvent, Event, EventSummary, EventDetail, Error, IdParam
- `apps/api/src/routes/events/events.routes.ts` - OpenAPI route definitions for all 5 event endpoints
- `apps/api/src/routes/events/events.handlers.ts` - Handler implementations mapping routes to service functions
- `apps/api/src/routes/events/events.index.ts` - Events sub-router with selective JWT middleware
- `apps/api/src/services/event-service.ts` - Drizzle queries for event CRUD with Result type pattern
- `apps/api/src/index.ts` - Updated to mount events router, removed blanket JWT middleware

## Decisions Made
- Applied selective JWT middleware on events sub-router (not blanket /api/*) to allow public GET /api/events/{id} for WhatsApp OG sharing
- Cast eventType from DB string to EventType since Drizzle uses text() column (validation enforced at API layer via Zod)
- Removed EventTypeSchema export (kept module-private) since it is only used within the schemas file
- Added explicit `| undefined` to optional service type properties for exactOptionalPropertyTypes strict mode
- Extracted helper functions from updateEvent to satisfy Biome cognitive complexity (max 15) and line count (max 50) limits

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome cognitive complexity and line count exceeded in updateEvent**
- **Found during:** Task 1
- **Issue:** updateEvent had 19 cognitive complexity (max 15) and 63 lines (max 50)
- **Fix:** Extracted buildUpdateFields, toEventRow, findEventById, getParticipantCount helpers
- **Files modified:** apps/api/src/services/event-service.ts
- **Verification:** Biome check passes
- **Committed in:** da97eac (Task 1 commit)

**2. [Rule 1 - Bug] Type narrowing for EventType with exactOptionalPropertyTypes**
- **Found during:** Task 2
- **Issue:** Service types used `string` for event type field, incompatible with OpenAPI enum type; optional properties needed explicit `| undefined`
- **Fix:** Changed service types to use EventType from @dt65/shared, added `| undefined` to optional properties, added as-casts from DB strings
- **Files modified:** apps/api/src/services/event-service.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** f28e9f5 (Task 2 commit)

**3. [Rule 1 - Bug] Biome namespace import not allowed**
- **Found during:** Task 2
- **Issue:** `import * as eventService` flagged by Biome noNamespaceImport rule
- **Fix:** Changed to named imports from event-service module
- **Files modified:** apps/api/src/routes/events/events.handlers.ts
- **Verification:** biome ci passes
- **Committed in:** f28e9f5 (Task 2 commit)

**4. [Rule 3 - Blocking] Knip unused export EventTypeSchema**
- **Found during:** Task 2
- **Issue:** EventTypeSchema exported but only used internally in same file
- **Fix:** Removed export keyword (made module-private)
- **Files modified:** apps/api/src/routes/events/events.schemas.ts
- **Verification:** pnpm knip passes
- **Committed in:** f28e9f5 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for strict TypeScript, Biome, and knip compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 event CRUD endpoints operational with OpenAPI documentation
- Participant join/leave endpoints needed (Plan 03: user profile and participation)
- OpenAPI spec at /doc includes all event routes
- All quality checks pass (lint, typecheck, knip, sherif, build)

---
*Phase: 04-api*
*Completed: 2026-03-18*
