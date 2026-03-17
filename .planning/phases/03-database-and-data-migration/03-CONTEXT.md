# Phase 3: Database and Data Migration - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

D1 database schema for events, users, and participation (no email preferences — deferred to Phase 6). Migration of ~1000 historical events, ~75 users, and participation records from DynamoDB JSON exports and Auth0 user export into D1. Schema managed with Drizzle ORM, migrations via Drizzle Kit + wrangler d1.

</domain>

<decisions>
## Implementation Decisions

### Schema design
- Three tables: `events`, `users`, `users_to_events` (schema already designed — see existing SQL)
- `eventType` stored as text, validated via Zod enum in the API layer (not CHECK constraint)
- `description` field stores raw HTML as-is from DynamoDB (events app renders it)
- No `email_preferences` table — deferred to Phase 6 (currently stored in Auth0)
- Event types are not enforced at DB level

### Source data
- 4 JSON dump files from DynamoDB containing event data — merge all, deduplicate by eventId/ULID
- Separate Auth0 user export JSON with ~75 users (Id, Nickname, Picture)
- All source files are gitignored, placed locally before running migration
- Users table populated from Auth0 export (canonical source), not extracted from DynamoDB events
- Some DynamoDB event participants won't exist in the Auth0 user export (deleted accounts)

### Migration strategy
- Schema: `drizzle-kit generate` → `wrangler d1 migrations apply`
- Data seeding: Generate a SQL file with INSERT statements from JSON, apply via `wrangler d1 execute`
- Migrate events, users, AND participation data (full history preserved)
- Event `creatorId` resolved to user ID — migration fails if creator not found in users table
- Orphaned participants (auth0 sub not in users export): skip and print warning to console
- Migration requires fresh DB (not idempotent) — to re-run: drop DB, apply schema, then seed

### Validation
- Automated count checks: event count, user count, participation counts per event compared to source
- Console output only — no report file generated
- No custom backup procedure — D1 Time Travel is sufficient

### Claude's Discretion
- Deduplication strategy for merging 4 JSON files (by eventId ULID)
- SQL generation script implementation details
- Exact console output format for warnings and validation summary

</decisions>

<specifics>
## Specific Ideas

- DynamoDB events have embedded `createdBy` object with `{nickname, picture, id}` and `participants` map — these need to be resolved to user IDs from the Auth0 export
- DynamoDB `type` field maps to D1 `eventType`
- DynamoDB timestamps: `_ct` (created), `_md` (modified) map to `createdAt`/`updatedAt`
- DynamoDB `race` is boolean, D1 stores as integer (0/1)
- Auth0 user format: `{Id, Nickname, Picture, "Created At", "Updated At"}`
- DynamoDB event format: uses `PK`/`SK` with `EVENT#<ULID>` pattern, `GSI1PK`/`GSI1SK` for queries

</specifics>

<deferred>
## Deferred Ideas

- Email preferences table — Phase 6 (currently in Auth0)

</deferred>

---

*Phase: 03-database-and-data-migration*
*Context gathered: 2026-03-17*
