# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Members can create sporting events and other members can join them
**Current focus:** Phase 1 complete. Next: Phase 2: Database and Data Migration

## Current Position

Phase: 1 of 6 (Monorepo and Tooling) -- COMPLETE
Plan: 2 of 2 in current phase (all plans complete)
Status: Phase Complete
Last activity: 2026-02-24 -- Completed 01-02-PLAN.md (GitHub Actions CI/CD pipeline)

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 12 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Monorepo and Tooling | 2/2 | 24 min | 12 min |

**Recent Trend:**
- Last 5 plans: 9m, 15m
- Trend: Starting

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Zod v4 vs v3 decision -- @hono/zod-openapi may not support Zod v4, needs validation before API implementation
- [Phase 3]: Hono built-in JWT middleware vs jose -- user prefers Hono built-in, verify it handles JWKS key rotation for Auth0

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 01-02-PLAN.md (Phase 1 complete)
Resume file: .planning/phases/01-monorepo-and-tooling/01-02-SUMMARY.md
