# Phase 4: API - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployed Hono API on Cloudflare Workers serving all event CRUD and participation endpoints with Auth0 JWT-protected access and automated tests. The API is consumed by the events frontend app. OpenAPI specification with Scalar documentation.

</domain>

<decisions>
## Implementation Decisions

### Endpoint & response design
- RESTful URL structure: `/api/events`, `/api/events/:id`, `/api/events/:id/participants`
- Direct payload responses — success returns the resource directly, errors use HTTP status + `{ error: { code, message } }`
- Event list returns summaries (title, date, type, participant count); detail endpoint returns full event
- OpenAPI spec via Zod OpenAPI; Scalar for interactive API documentation
- Pagination approach at Claude's discretion based on expected data volume

### Auth & authorization
- All API requests require `x-api-key` header (stored as env variable via VarLock, no rotation needed)
- Auth0 JWT required on all endpoints except individual event detail (public for WhatsApp OG sharing)
- Member identity from JWT `sub` claim (Auth0 user ID like `auth0|abc123`)
- Event ownership tracked via `createdBy` field in DB, compared against JWT `sub` for edit/delete
- Unauthorized edit/delete returns 403 Forbidden with message

### Event data model & validation
- 15 event types: CYCLING, KARONKKA (after-party), MEETING, NORDIC_WALKING, ICE_HOCKEY, ORIENTEERING, OTHER, RUNNING, SKIING, SPINNING, SWIMMING, TRACK_RUNNING, TRAIL_RUNNING, TRIATHLON, ULTRAS
- Race flag is a boolean — indicates the event is a competition vs. casual training
- Required fields: type, title, dateStart
- Optional fields: time, location, subtitle, description, race (defaults to false)
- Strict Zod validation with field-level error messages (400 status)

### Participation behavior
- Join is idempotent — re-joining returns 200 silently, no duplicate entry
- Leave is idempotent — leaving an event you're not in returns 200 silently
- Members can only join/leave upcoming events (dateStart in the future), 400 for past events
- Participant nicknames come from local members table in D1 (not Auth0)
- Participant list includes nickname + join timestamp (shows sign-up order)

### Claude's Discretion
- Pagination approach (cursor-based vs offset vs no pagination)
- Exact error response structure details
- Middleware ordering and composition
- Test structure and coverage strategy

</decisions>

<specifics>
## Specific Ideas

- Individual event endpoint must be public (no JWT) so members can share events on WhatsApp and Open Graph metadata is visible
- Event types are already defined in the shared package as `EVENT_TYPES` const array
- Use Zod OpenAPI for schema definitions that serve both validation and OpenAPI spec generation
- Scalar for interactive API documentation UI

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-api*
*Context gathered: 2026-03-17*
