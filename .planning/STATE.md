# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Members can create sporting events and other members can join them
**Current focus:** Phase 4 complete -- ready for Phase 5: Events Application

## Current Position

Phase: 4 of 6 (API Development) -- COMPLETE
Plan: 3 of 3 in current phase -- DONE
Status: Complete
Last activity: 2026-03-18 -- Completed 04-03-PLAN.md (Participation endpoints + tests)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 12 min
- Total execution time: 1.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Monorepo and Tooling | 2/2 | 24 min | 12 min |
| 3. Database and Data Migration | 2/2 | 29 min | 15 min |
| 4. API Development | 3/3 | 30 min | 10 min |

**Recent Trend:**
- Last 5 plans: 4m, 25m, 10m, 5m, 15m
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Zod v4 desired by user -- research flagged @hono/zod-openapi incompatibility, validate during Phase 3 implementation
- [Roadmap]: Use Hono built-in JWT middleware instead of jose library for Auth0 JWT verification
- [Roadmap]: Auth0 Lock component for login and forgot-password flows (not custom UI)
- [Roadmap]: Custom signup flow with registerSecret guard field (not Auth0 Lock signup)
- [Roadmap]: Participants displayed by nickname on events
- [Roadmap Revision]: Trunk-based development -- feature/fix branches, PR to main, auto-deploy on merge
- [Roadmap Revision]: On PR: lint, typecheck, knip, test, build + Cloudflare preview deployment URL
- [Roadmap Revision]: On merge to main: lint, typecheck, knip, test, build + `wrangler deploy` all 3 apps to production
- [Roadmap Revision]: Deploy all apps on every merge (not path-based triggers) -- simplest approach for 3 small apps
- [Roadmap Revision]: No staging environment -- comprehensive CI checks + Cloudflare instant rollback sufficient for ~100 members
- [Roadmap Revision]: React Router 7 with file-based routing for the events application
- [Roadmap Revision]: Development domain: downtown65.site -- switch to downtown65.com after v1 launch
- [Roadmap Revision]: GitHub repo with protected main branch -- PRs required, no direct push
- [Roadmap Revision]: Rebase merging only (no merge commits, no squash)
- [Roadmap Revision]: git config pull.rebase true
- [01-01]: Biome noDefaultExport disabled -- Cloudflare Workers require default exports
- [01-01]: Biome noNodejsModules disabled -- Workers use nodejs_compat_v2 flag
- [01-01]: Knip excludes catalog issue type -- catalog entries for later phases are intentional
- [01-01]: pnpm@10.29.2 used for packageManager field
- [01-02]: Extracted CI setup and quality checks into reusable composite actions (.github/actions/)
- [01-02]: Pinned GitHub Actions runners to ubuntu-24.04 for reproducibility
- [01-02]: Added Copilot code review workflow for automated PR feedback
- [01-02]: Added wrangler to knip ignoreBinaries -- CI uses npx wrangler which knip cannot resolve
- [01-02]: Branch protection configured: require quality status check, rebase-only merging
- [01-02]: Repository secrets configured: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- [03-01]: Excluded worker-configuration.d.ts from Biome linting (auto-generated file with any types)
- [03-01]: Added worker-configuration.d.ts to knip ignore (ambient declaration not imported)
- [03-01]: Used local-dev-placeholder as D1 database_id (real ID set when creating remote D1)
- [03-02]: Used per-line biome-ignore comments for console usage in CLI migration script (biome-ignore-all not valid)
- [03-02]: Added scripts/*.ts to knip entry points for migration scripts
- [03-02]: Orphaned participants (5 deleted Auth0 accounts) skipped with warnings, not errors
- [04-01]: Upgraded hono from 4.7.5 to 4.12.8 for @scalar/hono-api-reference peer dependency
- [04-01]: Used wrapper middleware pattern for JWT auth (hono/jwk verification options are static, env vars need request-time access)
- [04-01]: Removed knip includeEntryExports for shared package (library exports are consumed by other workspaces)
- [04-01]: Used empty string default for joined_at migration (SQLite rejects non-constant defaults in ALTER TABLE)
- [04-02]: Selective JWT middleware on events sub-router (not blanket /api/*) for public GET /api/events/{id}
- [04-02]: EventType as-cast from DB string since Drizzle uses text() column (validated at API layer via Zod)
- [04-02]: Extracted helper functions from updateEvent to satisfy Biome complexity limits (max 15 cognitive, max 50 lines)
- [04-03]: AuthenticationService interface replaces direct hono/jwk -- Auth0Service (production) + MockAuth0Service (tests)
- [04-03]: Auth0Service implements JWKS verification via Web Crypto API for clean interface separation
- [04-03]: createApiApp factory in create-app.ts for dependency injection of auth service
- [04-03]: DB.prepare().bind().run() for test seeding (DB.exec() fails in vitest-pool-workers due to observability tracing bug)
- [04-03]: X_API_KEY added to wrangler.jsonc vars as dev default (production overrides via Workers secrets)
- [04-03]: Email service interface deferred to Phase 6 (knip flags unused files)

### Pending Todos

None yet.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-18
Stopped at: Completed Phase 4 (all 3 plans)
Resume file: .planning/phases/04-api/04-03-SUMMARY.md
