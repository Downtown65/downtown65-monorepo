---
phase: 03-database-and-data-migration
plan: 02
subsystem: database
tags: [d1, sqlite, migration, dynamodb, auth0, zod, seed]

# Dependency graph
requires:
  - phase: 03-database-and-data-migration/01
    provides: D1 schema with users, events, users_to_events tables
provides:
  - DynamoDB-to-D1 migration script (apps/api/scripts/seed-from-dynamo.ts)
  - Seeded local D1 with 80 users, 1391 events, 7939 participation records
  - Reproducible migration from JSON exports to seed.sql
affects: [04-api-development, 05-events-app]

# Tech tracking
tech-stack:
  added: [zod (validation in migration script)]
  patterns: [JSON Lines parsing, DynamoDB native format unmarshalling, batched SQL INSERT generation]

key-files:
  created:
    - apps/api/scripts/seed-from-dynamo.ts
  modified:
    - apps/api/package.json
    - knip.json
    - pnpm-lock.yaml

key-decisions:
  - "Used per-line biome-ignore comments for console usage in CLI script (biome-ignore-all not a valid directive)"
  - "Added scripts/*.ts to knip entry points to avoid false-positive unused warnings"
  - "Orphaned participants (5 deleted Auth0 accounts) skipped with warnings, not errors"

patterns-established:
  - "Migration scripts live in apps/api/scripts/ and are registered as knip entry points"
  - "DynamoDB exports use JSON Lines format with native typed JSON -- unmarshalling required"

requirements-completed: [DATA-02]

# Metrics
duration: ~25min (including checkpoint verification)
completed: 2026-03-17
---

# Phase 3 Plan 02: Data Migration Summary

**DynamoDB-to-D1 migration script with JSON Lines parsing, DynamoDB format unmarshalling, and validated seed of 80 users, 1391 events, 7939 participation records**

## Performance

- **Duration:** ~25 min (including checkpoint verification)
- **Started:** 2026-03-17T12:28:27Z
- **Completed:** 2026-03-17T14:53:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Migration script reads 4 DynamoDB event exports + 1 Auth0 user export and generates seed.sql
- All 1391 events migrated with correct field mappings (title, dates, types, descriptions)
- All 80 users from Auth0 export present in D1 with nicknames and pictures
- 7939 participation records linking users to events
- 5 orphaned participants (deleted Auth0 accounts) skipped with warnings
- Migration is reproducible: delete .wrangler/state, reapply schema + seed, same counts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration script that generates seed.sql from JSON exports** - `e36e120` (feat)
2. **Task 1 fix: Handle DynamoDB native JSON format and JSON Lines input** - `6deb701` (fix)

**Plan metadata:** (pending)

## Files Created/Modified

- `apps/api/scripts/seed-from-dynamo.ts` - Migration script: reads JSON exports, validates with Zod, resolves users/participants, generates batched INSERT SQL
- `apps/api/package.json` - Added zod dependency for migration script validation
- `knip.json` - Added scripts/*.ts as entry points
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- Used per-line biome-ignore comments for console usage in the CLI migration script, since `biome-ignore-all` is not a valid Biome directive
- Added `scripts/*.ts` to knip entry points so migration scripts are not flagged as unused
- Orphaned participants (5 deleted Auth0 accounts) are skipped with console warnings rather than failing the migration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Source files were JSON Lines format, not JSON arrays**
- **Found during:** Task 1 (migration script execution)
- **Issue:** DynamoDB export files used JSON Lines format (one JSON object per line) instead of JSON arrays
- **Fix:** Added line-by-line parsing that splits file content by newlines and parses each line individually
- **Files modified:** apps/api/scripts/seed-from-dynamo.ts
- **Verification:** Script successfully parsed all 4 event export files
- **Committed in:** 6deb701

**2. [Rule 3 - Blocking] DynamoDB export used native typed JSON format**
- **Found during:** Task 1 (migration script execution)
- **Issue:** DynamoDB exports use native typed format (`{"S": "value"}`, `{"M": {...}}`, `{"BOOL": true}`) instead of plain JSON values
- **Fix:** Added DynamoDB unmarshaller to convert typed JSON to plain JavaScript values before Zod validation
- **Files modified:** apps/api/scripts/seed-from-dynamo.ts
- **Verification:** All fields correctly unmarshalled and validated
- **Committed in:** 6deb701

**3. [Rule 3 - Blocking] knip flagged migration script as unused**
- **Found during:** Task 1 (quality checks)
- **Issue:** knip detected the new script file as unused since it is not imported by any module
- **Fix:** Added `scripts/*.ts` as entry points in knip.json
- **Files modified:** knip.json
- **Verification:** `pnpm check` passes
- **Committed in:** e36e120

**4. [Rule 1 - Bug] biome-ignore-all is not a valid Biome directive**
- **Found during:** Task 1 (linting)
- **Issue:** Attempted to use `biome-ignore-all` to suppress console warnings for the CLI script, but it is not a valid directive
- **Fix:** Used per-line `biome-ignore` comments on individual console usage lines
- **Files modified:** apps/api/scripts/seed-from-dynamo.ts
- **Verification:** Biome lint passes
- **Committed in:** e36e120

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes were necessary to handle real-world data formats that differed from plan assumptions. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D1 database fully seeded with historical club data (80 users, 1391 events, 7939 participations)
- Schema and seed are reproducible for fresh local development setup
- Ready for Phase 4 API development against real data

---
*Phase: 03-database-and-data-migration*
*Completed: 2026-03-17*

## Self-Check: PASSED
