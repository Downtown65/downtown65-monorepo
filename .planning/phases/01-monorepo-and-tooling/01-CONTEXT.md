# Phase 1: Monorepo and Tooling - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fully configured TypeScript monorepo with pnpm workspaces, automated code quality enforcement (Biome, Knip, Sherif), Lefthook pre-push hooks, and GitHub Actions CI/CD with PR preview deploys and auto-deploy on merge. This phase delivers the foundation all other phases build on.

</domain>

<decisions>
## Implementation Decisions

### Workspace structure
- 3 apps: `apps/api`, `apps/events`, `apps/www`
- Shared code in `packages/` directory (e.g. `packages/shared`)
- All packages scoped under `@dt65/` (e.g. `@dt65/api`, `@dt65/events`, `@dt65/shared`)
- Shared base `tsconfig.base.json` at root, each app extends with overrides
- TypeScript project references enabled for incremental builds across workspaces
- Barrel exports from shared packages (index.ts re-exports public API)

### CI/CD workflow design
- 3 separate GitHub Actions workflow files: PR checks, PR cleanup, Deploy on merge
- All 3 apps get preview deploys on every PR (events and www depend on api)
- Per-PR D1 database for full isolation — each PR gets its own D1 instance
- CI runs all checks on all apps for every PR (no path-based filtering)
- PR cleanup workflow deletes preview Workers and PR-specific D1 databases when PR is closed/merged
- Deploy workflow builds and deploys all 3 apps to production on merge to main

### Development conventions
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:` with optional scope
- Branch naming: `type/description` (e.g. `feat/event-crud`, `fix/login-error`)
- File naming: PascalCase for React components (`EventList.tsx`), kebab-case for everything else (`auth-middleware.ts`)
- Tests in separate `__tests__/` directories mirroring source structure
- `.dev.vars` per app for local dev environment variables (Cloudflare convention)
- Path aliases: `@/` prefix for internal imports within each app
- Biome auto-sort for import ordering
- Root-level commands for CI/all-at-once (`pnpm build`, `pnpm check`), per-app commands for dev workflow
- Node.js 22 LTS
- pnpm catalog in `pnpm-workspace.yaml` for version pinning across workspaces
- Shared tooling deps at root, app-specific deps in each app's package.json
- Result types for error handling: `{ ok: true, data } | { ok: false, error }` — no throw/catch for business logic
- Interface pattern for all external dependencies: interface + implementation (e.g. `AuthenticationService` / `Auth0Service`, `DatabaseService`, `MailService`)
- Zod validation for all `c.env` bindings at app startup — fail fast if anything missing, no raw env access
- LogLayer with console transport for structured logging (setup in later phases)
- CLAUDE.md at root — Claude drafts, user reviews before finalizing

### Testing patterns
- Integration tests: `@cloudflare/vitest-pool-workers` for testing in actual Workers runtime
- Unit tests: standard Vitest for isolated logic testing
- Mocking strategy: interface-based mocks for Mail and Authentication services; test against real D1 (in-memory via Workers pool)
- Test naming convention: Claude's discretion

### Code quality strictness
- Biome: strict mode — all recommended rules enabled, errors on violations
- Biome formatting: 2-space indentation, semicolons
- Biome: ban `console.log` in source files — use logger instead
- TypeScript: full strict — `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- Knip: strict — error on any unused exports, files, or dependencies
- Sherif: strict — error on inconsistent dependency versions across workspaces
- Test coverage: report only — generate reports but don't enforce minimum threshold
- Lefthook pre-push: check only (lint, typecheck, knip) — report errors, don't auto-fix

### Claude's Discretion
- CLAUDE.md content (user will review)
- Test naming convention (describe/it vs test blocks)
- Exact Biome rule exceptions if needed
- LogLayer configuration details (later phases)

</decisions>

<specifics>
## Specific Ideas

- www app fetches member count and event count from the API — not a standalone static site
- pnpm catalog with specific starting versions:
  - `@biomejs/biome`: 2.3.14
  - `@cloudflare/vitest-pool-workers`: 0.12.1
  - `@hono/zod-openapi`: 1.2.1
  - `@types/node`: 25.0.3
  - `@vitest/coverage-v8`: 3.2.0
  - `jwt-decode`: 4.0.0
  - `knip`: 5.83.0
  - `rimraf`: 6.1.2
  - `tsx`: 4.21.0
  - `typescript`: 5.9.3
  - `vitest`: 3.2.0
  - `wrangler`: 4.63.0
  - `zod`: 4.3.5

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-monorepo-and-tooling*
*Context gathered: 2026-02-22*
