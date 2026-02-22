---
phase: 01-monorepo-and-tooling
plan: 01
subsystem: infra
tags: [pnpm, typescript, biome, knip, sherif, lefthook, monorepo, cloudflare-workers]

# Dependency graph
requires: []
provides:
  - pnpm monorepo with catalog-based dependency management
  - TypeScript project references for incremental builds
  - Biome v2 strict linting and formatting
  - Knip dead code detection across workspaces
  - Lefthook pre-push hooks (lint, typecheck, knip)
  - 3 Cloudflare Worker app scaffolds (api, events, www)
  - Shared package (@dt65/shared) with barrel exports
  - CLAUDE.md project conventions guide
affects: [01-02, 02-database, 03-api, 04-events, 05-email, 06-website]

# Tech tracking
tech-stack:
  added: [pnpm@10.29.2, typescript@5.9.3, biome@2.3.14, knip@5.83.0, lefthook@2.1.1, wrangler@4.63.0, vitest@3.2.0, rimraf@6.1.2, tsx@4.21.0]
  patterns: [pnpm-catalogs, typescript-project-references, biome-monorepo-config, workspace-star-protocol]

key-files:
  created:
    - pnpm-workspace.yaml
    - package.json
    - tsconfig.base.json
    - tsconfig.json
    - biome.json
    - knip.json
    - lefthook.yml
    - CLAUDE.md
    - apps/api/package.json
    - apps/api/src/index.ts
    - apps/api/wrangler.jsonc
    - apps/events/package.json
    - apps/events/src/index.ts
    - apps/events/wrangler.jsonc
    - apps/www/package.json
    - apps/www/src/index.ts
    - apps/www/wrangler.jsonc
    - packages/shared/package.json
    - packages/shared/src/index.ts
  modified: []

key-decisions:
  - "Used pnpm@10.29.2 (latest available) for packageManager field"
  - "Disabled noDefaultExport Biome rule -- Cloudflare Workers require default exports"
  - "Disabled noNodejsModules Biome rule -- Workers use nodejs_compat_v2 flag"
  - "Excluded catalog issue type in Knip -- catalog entries for later phases (zod, hono, jwt-decode) are intentional"
  - "Added --passWithNoTests to vitest scripts -- prevents failure during scaffold stage"
  - "Biome excludes .claude/.agents/.planning directories via includes negation pattern"
  - "Added esbuild, sharp, workerd to pnpm.onlyBuiltDependencies -- required for build scripts"

patterns-established:
  - "catalog: protocol for all dependency versions in pnpm-workspace.yaml"
  - "workspace:* protocol for cross-workspace dependencies"
  - "TypeScript project references with tsconfig.base.json extends pattern"
  - "Biome v2 root config with files.includes negation for directory exclusion"
  - "Knip workspace-aware config with per-workspace ignoreDependencies"
  - "Lefthook pre-push with parallel lint/typecheck/knip"

requirements-completed: [INFR-01, INFR-02, INFR-03, INFR-06]

# Metrics
duration: 9min
completed: 2026-02-22
---

# Phase 1 Plan 01: Monorepo and Tooling Summary

**pnpm monorepo with 4 workspaces, strict TypeScript project references, Biome v2 linting, Knip dead code detection, Lefthook pre-push hooks, and CLAUDE.md conventions guide**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-22T10:45:00Z
- **Completed:** 2026-02-22T10:54:29Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments

- Fully configured pnpm monorepo with catalog-based version pinning across 4 workspaces
- Strict TypeScript config with project references enabling incremental builds
- Code quality pipeline: `pnpm check` runs Biome + Knip + Sherif with zero issues
- All 3 apps build via `wrangler deploy --dry-run`, typecheck passes, test runner works
- Lefthook pre-push hooks installed and configured for lint/typecheck/knip
- CLAUDE.md documents project conventions, commands, and coding patterns

## Task Commits

Each task was committed atomically:

1. **Task 1a: Create root monorepo configuration and TypeScript base** - `77e3666` (chore)
2. **Task 1b: Create workspace scaffolds (apps and shared package)** - `7dab1db` (feat)
3. **Task 2: Configure code quality tools, Lefthook hooks, and CLAUDE.md** - `cd1a4a3` (feat)

## Files Created/Modified

- `pnpm-workspace.yaml` - Workspace definitions with catalog pinning 13 dependencies
- `package.json` - Root package with workspace scripts and shared devDependencies
- `.npmrc` - Auto-install peers, relaxed peer deps
- `.gitignore` - node_modules, dist, .wrangler, tsbuildinfo, coverage, .DS_Store
- `tsconfig.base.json` - Shared strict TypeScript compiler options
- `tsconfig.json` - Root project references to all 4 workspaces
- `biome.json` - Strict Biome v2 config (noConsole, single quotes, 2-space indent)
- `knip.json` - Workspace-aware dead code detection config
- `lefthook.yml` - Pre-push hooks running lint, typecheck, knip in parallel
- `CLAUDE.md` - Project conventions, commands, and coding patterns
- `apps/api/` - @dt65/api scaffold (Cloudflare Worker with wrangler config)
- `apps/events/` - @dt65/events scaffold (Cloudflare Worker)
- `apps/www/` - @dt65/www scaffold (Cloudflare Worker)
- `packages/shared/` - @dt65/shared with barrel export (DT65_APP_NAME)

## Decisions Made

- **pnpm@10.29.2** used for packageManager field (latest available at execution time)
- **noDefaultExport disabled** in Biome -- Cloudflare Workers require `export default` for their fetch handler
- **noNodejsModules disabled** in Biome -- Workers use `nodejs_compat_v2` compatibility flag
- **Catalog exclusion in Knip** -- `@hono/zod-openapi`, `jwt-decode`, `zod` are catalog entries for later phases, excluded to prevent false positives
- **--passWithNoTests** added to vitest scripts -- prevents test failure during scaffold stage when no test files exist
- **esbuild, sharp, workerd** added to `pnpm.onlyBuiltDependencies` -- required for their postinstall build scripts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome v2 files.ignore key does not exist**
- **Found during:** Task 2 (Biome configuration)
- **Issue:** Biome v2 replaced `files.ignore` with `files.includes` -- the v1 syntax caused a config error
- **Fix:** Used `files.includes` with negation patterns: `["**", "!.claude", "!.agents", "!.planning"]`
- **Files modified:** biome.json
- **Verification:** `biome check .` passes without scanning excluded directories
- **Committed in:** cd1a4a3

**2. [Rule 1 - Bug] noDefaultExport conflicts with Cloudflare Workers**
- **Found during:** Task 2 (Biome check)
- **Issue:** Biome's `style/noDefaultExport` flagged all Worker entry points, but Workers require `export default`
- **Fix:** Disabled `noDefaultExport` in root biome.json
- **Files modified:** biome.json
- **Verification:** `biome check .` passes, Worker exports compile correctly
- **Committed in:** cd1a4a3

**3. [Rule 1 - Bug] noNodejsModules incompatible with nodejs_compat_v2**
- **Found during:** Task 2 (Biome check)
- **Issue:** Biome's `correctness/noNodejsModules` flagged Node.js imports, but Workers with `nodejs_compat_v2` support them
- **Fix:** Disabled `noNodejsModules` in root biome.json
- **Files modified:** biome.json
- **Verification:** `biome check .` passes
- **Committed in:** cd1a4a3

**4. [Rule 3 - Blocking] esbuild/workerd/sharp build scripts not approved**
- **Found during:** Task 1b (pnpm install)
- **Issue:** pnpm blocked postinstall scripts for esbuild, workerd, and sharp -- required for TypeScript tooling and Wrangler
- **Fix:** Added `esbuild`, `sharp`, `workerd` to `pnpm.onlyBuiltDependencies` in root package.json
- **Files modified:** package.json
- **Verification:** `pnpm install` completes without warnings
- **Committed in:** cd1a4a3

**5. [Rule 1 - Bug] Vitest exits with code 1 when no tests found**
- **Found during:** Task 2 (pnpm test verification)
- **Issue:** `vitest run` exits with code 1 when no test files exist, causing `pnpm test` to fail during scaffold stage
- **Fix:** Added `--passWithNoTests` flag to all workspace test scripts
- **Files modified:** apps/api/package.json, apps/events/package.json, apps/www/package.json, packages/shared/package.json
- **Verification:** `pnpm test` exits with code 0
- **Committed in:** cd1a4a3

**6. [Rule 2 - Missing Critical] API app not importing from @dt65/shared**
- **Found during:** Task 2 (Knip check)
- **Issue:** Knip flagged `@dt65/shared` as unused dependency and `DT65_APP_NAME` as unused export -- workspace linking was declared but not validated
- **Fix:** Added `import { DT65_APP_NAME } from '@dt65/shared'` to `apps/api/src/index.ts`, validating the workspace link actually works
- **Files modified:** apps/api/src/index.ts
- **Verification:** `pnpm knip` passes, `pnpm tsc --build` passes
- **Committed in:** cd1a4a3

---

**Total deviations:** 6 auto-fixed (3 bugs, 1 blocking, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness and clean quality checks. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Monorepo structure is fully operational: install, build, typecheck, lint, test all pass
- GitHub Actions CI/CD (Plan 01-02) can build on this foundation
- All subsequent phases can add code to the workspace structure
- Catalog has version pins ready for api (hono, zod) and auth (jwt-decode) phases

## Self-Check: PASSED

- All 25 created files verified present
- All 3 task commits verified (77e3666, 7dab1db, cd1a4a3)
- `pnpm install` succeeds
- `pnpm tsc --build` succeeds
- `pnpm -r run build` succeeds
- `pnpm check` succeeds (Biome + Knip + Sherif)
- `pnpm test` succeeds
- Lefthook pre-push hook installed

---
*Phase: 01-monorepo-and-tooling*
*Completed: 2026-02-22*
