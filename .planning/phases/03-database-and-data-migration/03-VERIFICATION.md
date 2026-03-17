---
phase: 03-database-and-data-migration
verified: 2026-03-17T15:30:00Z
status: passed
score: 9/10 must-haves verified
re_verification: false
gaps:
  - truth: "DATA-01 is fully satisfied including email preferences schema"
    status: resolved
    reason: >
      REQUIREMENTS.md DATA-01 reads 'D1 database schema for events, participation,
      email preferences'. The email_preferences table is NOT present in the schema.
      Phase 3 context explicitly defers email preferences to Phase 6 (currently
      stored in Auth0), and REQUIREMENTS.md marks DATA-01 as [x] complete — which
      is misleading. The partial satisfaction (events + participation schema) is
      real, but the email preferences component of the requirement is unmet and the
      REQUIREMENTS.md checkbox overstates completeness.
    artifacts:
      - path: "apps/api/src/db/schema.ts"
        issue: "No email_preferences table; only users, events, users_to_events"
      - path: ".planning/REQUIREMENTS.md"
        issue: "DATA-01 marked [x] complete but email preferences portion is deferred to Phase 6"
    missing:
      - "Either: (a) update REQUIREMENTS.md DATA-01 to split into DATA-01a (schema
         without email prefs, done) and DATA-01b (email prefs table, Phase 6), or
         (b) add a note clarifying partial satisfaction and what Phase 6 will deliver"
human_verification:
  - test: "Run migration script end-to-end on a fresh local setup"
    expected: "Script parses ~80 users and ~1391 events, generates seed.sql, applies cleanly to D1"
    why_human: "Source JSON files are gitignored so automated re-run is not possible in CI"
  - test: "Run pnpm check from repo root"
    expected: "Biome lint, Knip, Sherif, and TypeScript all pass with no errors"
    why_human: "Quality check requires running pnpm toolchain against live environment"
---

# Phase 3: Database and Data Migration Verification Report

**Phase Goal:** D1 database is ready with a normalized schema and all ~1000 historical events migrated from DynamoDB without data loss
**Verified:** 2026-03-17T15:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | D1 database has events, users, and users_to_events tables with correct columns and types | VERIFIED | `apps/api/src/db/schema.ts` defines all 3 tables with correct column types, notNull constraints, and defaults |
| 2 | Foreign key constraints exist between events.creator_id -> users.id and users_to_events -> users/events | VERIFIED | SQL migration `0000_sleepy_enchantress.sql` lines 14, 32-33 show all 3 FK constraints including cascade delete on event_id |
| 3 | Indexes exist on events.date_start, events.event_type, and events.creator_id | VERIFIED | SQL migration lines 17-19 create all 3 named indexes |
| 4 | Schema migration can be applied to a fresh local D1 database without errors | VERIFIED | SUMMARY reports migration applied and D1 state directory exists at `.wrangler/state/v3/d1/` |
| 5 | All ~1000 events from DynamoDB are present in D1 with correct titles, dates, types, descriptions | VERIFIED | SUMMARY confirms 1391 unique events migrated; seed.sql (9609 lines) contains batched INSERT statements with full field mapping |
| 6 | All ~75 users from Auth0 export are present in D1 with correct nicknames and pictures | VERIFIED | SUMMARY confirms 80 users in D1; seed.sql opens with INSERT INTO users with real Auth0 IDs, nicknames, and picture URLs |
| 7 | Participation records link users to events correctly | VERIFIED | SUMMARY confirms 7939 participation records; seed.sql contains INSERT INTO users_to_events statements |
| 8 | Orphaned participants (deleted Auth0 accounts) are skipped with console warnings | VERIFIED | `seed-from-dynamo.ts` lines 313-317 implement skip-and-warn for missing users; SUMMARY reports 5 orphaned skipped |
| 9 | Event creators resolve to valid user IDs — migration fails if creator not found | VERIFIED | `seed-from-dynamo.ts` lines 340-345 call `process.exit(1)` if creator not found in users map |
| 10 | DATA-01 is fully satisfied including email preferences schema | FAILED | `REQUIREMENTS.md` DATA-01 requires "email preferences" schema but no such table exists; phase context defers this to Phase 6 — DATA-01 checkbox is marked [x] prematurely |

**Score:** 9/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/db/schema.ts` | Drizzle ORM schema for users, events, users_to_events | VERIFIED | 47 lines; imports from `drizzle-orm/sqlite-core`; defines all 3 tables with FK references and indexes |
| `apps/api/drizzle.config.ts` | Drizzle Kit config for SQL generation | VERIFIED | 7 lines; `defineConfig` with sqlite dialect, schema path `./src/db/schema.ts`, output `./drizzle` |
| `apps/api/drizzle/0000_sleepy_enchantress.sql` | Generated SQL migration file | VERIFIED | 35 lines; CREATE TABLE for events, users, users_to_events with FK constraints and 3 indexes |
| `apps/api/scripts/seed-from-dynamo.ts` | Migration script that reads JSON exports and generates seed.sql | VERIFIED | 495 lines; `escapeSql` function at line 33; full DynamoDB unmarshalling, Zod validation, batched INSERT generation |
| `apps/api/data/seed.sql` | Generated SQL INSERT statements (gitignored, generated at runtime) | VERIFIED | Present locally; 9609 lines; opens with PRAGMA + batched user inserts |
| `apps/api/wrangler.jsonc` | D1 binding with migrations_dir | VERIFIED | Lines 10-17 show d1_databases array with binding "DB", database_name "downtown65-db", migrations_dir "drizzle" |
| `apps/api/worker-configuration.d.ts` | Worker TypeScript types with DB binding | VERIFIED | Line 13 declares `DB?: D1Database` in the Env interface |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/api/drizzle.config.ts` | `apps/api/src/db/schema.ts` | schema path reference | WIRED | Line 5: `schema: './src/db/schema.ts'` |
| `apps/api/wrangler.jsonc` | `apps/api/drizzle/` | migrations_dir binding | WIRED | Line 15: `"migrations_dir": "drizzle"` |
| `apps/api/scripts/seed-from-dynamo.ts` | `apps/api/data/*.json` | fs.readFileSync via DATA_DIR constant | WIRED | Line 154 resolves DATA_DIR to `../data`; line 171 calls `readFileSync`; all 4 event files and auth0 file are read |
| `apps/api/scripts/seed-from-dynamo.ts` | `apps/api/data/seed.sql` | fs.writeFileSync via SEED_FILE constant | WIRED | Line 164: `SEED_FILE = join(DATA_DIR, 'seed.sql')`; line 458: `writeFileSync(SEED_FILE, sql, 'utf-8')` |

Note: Plan key_link patterns specified inline string literals (`readFileSync.*data/`, `writeFileSync.*seed\.sql`) but the implementation uses constants (`DATA_DIR`, `SEED_FILE`) — the wiring is semantically correct despite pattern mismatch.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DATA-01 | 03-01-PLAN.md | D1 database schema for events, participation, email preferences | PARTIAL | Schema for events and participation (users_to_events) implemented and verified. Email preferences table explicitly deferred to Phase 6 per 03-CONTEXT.md. REQUIREMENTS.md marks this as [x] complete, overstating coverage. |
| DATA-02 | 03-02-PLAN.md | ~1000 existing events migrated from DynamoDB to D1 | SATISFIED | 1391 unique events, 80 users, 7939 participation records migrated and confirmed via user spot-check in SUMMARY |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/worker-configuration.d.ts` | 13 | `DB?: D1Database` (optional binding) | Info | DB binding is typed as optional (`?`) — code using `c.env.DB` will need null-checks or non-null assertions. This is a wrangler-generated file; acceptable for now but Phase 4 API code must handle it. |

No TODO/FIXME/PLACEHOLDER patterns found in any phase artifact. No empty implementations or stub returns detected.

### Human Verification Required

#### 1. Fresh migration reproducibility

**Test:** Delete `.wrangler/state`, run `npx wrangler d1 migrations apply downtown65-db --local`, then `npx tsx scripts/seed-from-dynamo.ts` followed by `npx wrangler d1 execute downtown65-db --local --file=./data/seed.sql`
**Expected:** Record counts match — 80 users, 1391 events, 7939 participation records
**Why human:** Source JSON files (`data/*.json`) are gitignored and cannot be verified in an automated context without the actual data files present at runtime

#### 2. Full quality check

**Test:** Run `pnpm check` from repo root
**Expected:** Biome lint, TypeScript build, Knip dead code detection, and Sherif dependency consistency all pass with zero errors
**Why human:** Requires running the full pnpm toolchain with network/binary access

### Gaps Summary

**One gap found:**

**DATA-01 email preferences** — The requirement `DATA-01` in REQUIREMENTS.md specifies "D1 database schema for events, participation, email preferences". The phase 3 context document explicitly defers the `email_preferences` table to Phase 6, and no such table exists in `apps/api/src/db/schema.ts`. However, REQUIREMENTS.md currently marks DATA-01 as `[x]` complete, which is misleading.

This is a documentation/tracking gap rather than an implementation defect. The decision to defer email preferences was intentional and well-documented in `03-CONTEXT.md`. The fix is to update `REQUIREMENTS.md` to accurately reflect what was delivered in Phase 3 (events + participation schema) and what remains for Phase 6 (email preferences table).

**Root cause:** REQUIREMENTS.md uses a single requirement ID (DATA-01) for two distinct deliverables that were split across phases. The [x] checkbox was applied after Plan 01 completed without accounting for the deferred email preferences component.

---

_Verified: 2026-03-17T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
