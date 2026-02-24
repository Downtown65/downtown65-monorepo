---
phase: 01-monorepo-and-tooling
plan: 02
subsystem: infra
tags: [github-actions, ci-cd, cloudflare-workers, wrangler, preview-deploy, d1]

# Dependency graph
requires:
  - phase: 01-monorepo-and-tooling/01
    provides: pnpm monorepo with workspace scripts, Biome, Knip, Sherif, TypeScript project references
provides:
  - GitHub Actions PR checks workflow (lint, typecheck, knip, sherif, test, build)
  - Per-PR Cloudflare Workers preview deployments with isolated D1 databases
  - PR cleanup workflow (deletes preview Workers and PR D1 on close)
  - Production deploy workflow (all 3 apps on merge to main)
  - Reusable composite actions for CI setup and quality checks
  - Copilot code review workflow for PRs
affects: [02-database, 03-api, 04-events, 05-email, 06-website]

# Tech tracking
tech-stack:
  added: [github-actions, cloudflare-wrangler-action@v3, actions-github-script@v7]
  patterns: [composite-actions, pr-preview-deploys, per-pr-d1-isolation, rebase-only-merging]

key-files:
  created:
    - .github/workflows/pr-checks.yml
    - .github/workflows/pr-cleanup.yml
    - .github/workflows/deploy.yml
    - .github/workflows/copilot-review.yml
    - .github/actions/setup/action.yml
    - .github/actions/quality-checks/action.yml
    - apps/api/.dev.vars.example
    - apps/events/.dev.vars.example
    - apps/www/.dev.vars.example
  modified:
    - knip.json
    - package.json
    - CLAUDE.md

key-decisions:
  - "Extracted CI setup (checkout, pnpm, node) into reusable composite action .github/actions/setup"
  - "Extracted quality checks into reusable composite action .github/actions/quality-checks"
  - "Pinned all GitHub Actions runners to ubuntu-24.04 for reproducibility"
  - "Added Copilot code review workflow for automated PR review"
  - "Added wrangler to knip ignoreBinaries -- CI uses npx wrangler which knip cannot resolve"
  - "Branch protection configured: require quality status check, rebase-only merging"
  - "Repository secrets set: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID"

patterns-established:
  - "Composite actions pattern: shared setup and quality-checks actions reduce duplication across workflows"
  - "Per-PR D1 database isolation: dt65-pr-{N} naming convention for preview databases"
  - "Per-PR Worker naming: dt65-{app}-pr-{N} for preview Workers"
  - "Idempotent PR comment with hidden marker: <!-- dt65-preview-urls -->"
  - "Deploy workflow re-runs full quality checks even after PR checks passed (catches rebase issues)"

requirements-completed: [INFR-04]

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 1 Plan 02: CI/CD Pipeline Summary

**GitHub Actions CI/CD with PR quality checks, per-PR Cloudflare Workers preview deploys with isolated D1 databases, PR cleanup, and auto-deploy all 3 apps to production on merge**

## Performance

- **Duration:** ~15 min (across two sessions with human-verify checkpoint)
- **Started:** 2026-02-22T11:00:00Z
- **Completed:** 2026-02-24T07:15:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 18

## Accomplishments

- PR checks workflow runs 6 quality gates (biome, tsc, knip, sherif, test, build) then deploys preview Workers for all 3 apps with per-PR D1 database isolation
- PR cleanup workflow deletes all preview Workers and PR-specific D1 database on PR close
- Production deploy workflow runs full checks then deploys all 3 apps via wrangler on merge to main
- Reusable composite actions extracted for CI setup and quality checks (reducing duplication across 3 workflows)
- GitHub repository configured with branch protection (require quality check, rebase-only merging) and Cloudflare secrets
- Copilot code review workflow added for automated PR feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PR checks workflow with preview deploys** - `8e93a3f` (feat)
2. **Task 2: Create PR cleanup and production deploy workflows** - `74f375b` (feat)
3. **Task 3: Verify CI/CD workflows and configure GitHub repository** - checkpoint:human-verify (approved)

Additional commits during checkpoint review (by user):
- `f319f35` - chore: Add Biome lint/format scripts to workspaces
- `55d9d30` - refactor: extract CI setup and quality checks into composite actions
- `3642170` - fix(01-02): ignore wrangler binary in knip config for CI workflows
- `ac7f8fc` - ci(01-02): add Copilot code review workflow for PRs
- `c8155ac` - ci(01-02): pin GitHub Actions runners to ubuntu-24.04
- `b7442df` - feat(01-01): add local dev environment setup

## Files Created/Modified

- `.github/workflows/pr-checks.yml` - PR quality checks (biome, tsc, knip, sherif, test, build) + preview deployment of all 3 Workers with per-PR D1
- `.github/workflows/pr-cleanup.yml` - Deletes preview Workers and PR D1 database on PR close
- `.github/workflows/deploy.yml` - Production deploy: full quality checks then wrangler deploy all 3 apps on merge to main
- `.github/workflows/copilot-review.yml` - Copilot code review on pull requests
- `.github/actions/setup/action.yml` - Reusable composite action for checkout + pnpm + node setup
- `.github/actions/quality-checks/action.yml` - Reusable composite action for all quality checks
- `apps/api/.dev.vars.example` - Example environment variables for local API development
- `apps/events/.dev.vars.example` - Example environment variables for local events development
- `apps/www/.dev.vars.example` - Example environment variables for local www development
- `knip.json` - Added wrangler to ignoreBinaries for CI compatibility
- `package.json` - Added dev script for parallel local development
- `CLAUDE.md` - Updated with local development instructions and dev commands

## Decisions Made

- **Composite actions for DRY CI** -- Extracted shared setup (checkout, pnpm, node) and quality checks into reusable `.github/actions/` composite actions, eliminating duplication across 3 workflows
- **Pinned runners to ubuntu-24.04** -- Explicit runner version for build reproducibility instead of ubuntu-latest
- **Copilot code review** -- Added automated code review on PRs via GitHub Copilot
- **Knip wrangler ignore** -- Added wrangler to `ignoreBinaries` in knip config since CI uses `npx wrangler` which knip cannot resolve statically
- **Branch protection** -- Configured to require `quality` status check before merge, rebase-only merging (no merge commits, no squash)
- **Local dev setup** -- Added `pnpm dev` for parallel local development and `.dev.vars.example` files for each app

## Deviations from Plan

### Additional Work During Checkpoint

The following changes were made during the human-verify checkpoint by the user, going beyond the original plan scope but improving the CI/CD setup:

**1. Composite action extraction** (refactor)
- Extracted shared CI setup and quality checks into reusable composite actions
- Reduces duplication and maintenance burden across 3 workflow files

**2. Runner pinning** (improvement)
- Pinned all runners to ubuntu-24.04 instead of ubuntu-latest for reproducibility

**3. Copilot review** (addition)
- Added `.github/workflows/copilot-review.yml` for automated code review

**4. Knip config fix** (bug fix)
- Added wrangler to `ignoreBinaries` in knip.json for CI compatibility

**5. Local dev environment** (addition)
- Added `pnpm dev` command and `.dev.vars.example` files for local development

---

**Total deviations:** 5 improvements during checkpoint (all user-initiated, no scope creep from executor)
**Impact on plan:** All changes improve CI/CD quality and developer experience. No negative impact.

## Issues Encountered

None -- plan executed as written and checkpoint review led to quality improvements.

## User Setup Required

GitHub repository configuration was completed during the checkpoint:
- Branch protection for main (require quality status check, rebase-only merging)
- Repository secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- git config pull.rebase true

## Next Phase Readiness

- CI/CD pipeline is fully operational: PRs trigger quality checks and preview deploys
- Production deployment is automated on merge to main
- Phase 1 is complete -- ready for Phase 2 (Database and Data Migration)
- All subsequent phases automatically get CI/CD coverage for their code changes

## Self-Check: PASSED

- All 12 key files verified present on disk
- All 7 commits verified in git history (8e93a3f, 74f375b, 55d9d30, 3642170, ac7f8fc, c8155ac, b7442df)
- SUMMARY.md created at `.planning/phases/01-monorepo-and-tooling/01-02-SUMMARY.md`

---
*Phase: 01-monorepo-and-tooling*
*Completed: 2026-02-24*
