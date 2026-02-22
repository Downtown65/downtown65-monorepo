# Phase 1: Monorepo and Tooling - Research

**Researched:** 2026-02-22
**Domain:** TypeScript monorepo setup, code quality tooling, CI/CD pipeline
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire development foundation: a pnpm workspace monorepo with 3 apps and shared packages, strict TypeScript configuration, automated code quality enforcement via Biome + Knip + Sherif, Lefthook pre-push hooks, and GitHub Actions CI/CD with Cloudflare Workers preview deploys per PR and auto-deploy on merge.

The tooling stack is well-established and all tools have mature monorepo support. pnpm catalogs (introduced in pnpm 9.5) centralize dependency versions in `pnpm-workspace.yaml`. Biome v2 has native monorepo support with the `extends: "//"` microsyntax for nested configs. Knip auto-discovers pnpm workspaces. Sherif is zero-config for monorepos. The main complexity lies in the CI/CD pipeline: per-PR D1 database isolation requires scripting `wrangler d1 create`/`delete` in GitHub Actions since no built-in per-PR database provisioning exists.

**Primary recommendation:** Use pnpm workspaces with catalogs for dependency management, Biome v2 with root + nested configs for linting/formatting, and `wrangler versions upload --preview-alias pr-<number>` for PR preview deploys.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 3 apps: `apps/api`, `apps/events`, `apps/www`
- Shared code in `packages/` directory (e.g. `packages/shared`)
- All packages scoped under `@dt65/` (e.g. `@dt65/api`, `@dt65/events`, `@dt65/shared`)
- Shared base `tsconfig.base.json` at root, each app extends with overrides
- TypeScript project references enabled for incremental builds across workspaces
- Barrel exports from shared packages (index.ts re-exports public API)
- 3 separate GitHub Actions workflow files: PR checks, PR cleanup, Deploy on merge
- All 3 apps get preview deploys on every PR (events and www depend on api)
- Per-PR D1 database for full isolation -- each PR gets its own D1 instance
- CI runs all checks on all apps for every PR (no path-based filtering)
- PR cleanup workflow deletes preview Workers and PR-specific D1 databases when PR is closed/merged
- Deploy workflow builds and deploys all 3 apps to production on merge to main
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
- Result types for error handling: `{ ok: true, data } | { ok: false, error }` -- no throw/catch for business logic
- Interface pattern for all external dependencies
- Zod validation for all `c.env` bindings at app startup
- CLAUDE.md at root -- Claude drafts, user reviews before finalizing
- Integration tests: `@cloudflare/vitest-pool-workers` for testing in actual Workers runtime
- Unit tests: standard Vitest for isolated logic testing
- Biome: strict mode -- all recommended rules enabled, errors on violations
- Biome formatting: 2-space indentation, semicolons
- Biome: ban `console.log` in source files -- use logger instead
- TypeScript: full strict -- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- Knip: strict -- error on any unused exports, files, or dependencies
- Sherif: strict -- error on inconsistent dependency versions across workspaces
- Test coverage: report only -- generate reports but don't enforce minimum threshold
- Lefthook pre-push: check only (lint, typecheck, knip) -- report errors, don't auto-fix
- Rebase merging only (no merge commits, no squash)
- git config pull.rebase true
- Protected main branch -- PRs required, no direct push

### Claude's Discretion
- CLAUDE.md content (user will review)
- Test naming convention (describe/it vs test blocks)
- Exact Biome rule exceptions if needed
- LogLayer configuration details (later phases)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | TypeScript monorepo with pnpm workspaces | pnpm workspace config with `packages` array, catalog protocol for shared versions, `@dt65/` scoped packages, `tsconfig.base.json` with project references |
| INFR-02 | Biome linting/formatting, Knip dead code detection, Sherif dependency consistency | Biome v2 monorepo support with `extends: "//"`, Knip auto-discovers pnpm workspaces, Sherif zero-config enforcement |
| INFR-03 | Lefthook pre-push hooks (lint, typecheck, knip) | Lefthook `pre-push` jobs with `parallel: true`, pnpm `onlyBuiltDependencies` required for postinstall |
| INFR-04 | GitHub Actions CI pipeline | 3 workflow files: PR checks (lint/typecheck/knip/test/build + preview deploy), PR cleanup (delete preview workers + D1), Deploy on merge (production deploy all 3 apps) |
| INFR-06 | CLAUDE.md project instructions | Root-level CLAUDE.md with project conventions, coding standards, architecture decisions |
</phase_requirements>

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| pnpm | 10.x (latest) | Package manager with workspace support | Catalogs for centralized version management, strict dependency isolation, fast installs |
| TypeScript | 5.9.3 | Type system | Latest stable with improved tsconfig defaults, project references support |
| Biome | 2.3.14 | Linting + formatting | Single tool replaces ESLint + Prettier, native monorepo support in v2, fast (Rust-based) |
| Knip | 5.83.0 | Dead code detection | Auto-discovers pnpm workspaces, finds unused files/exports/dependencies |
| Sherif | latest | Dependency consistency | Zero-config monorepo linter, Rust-based, catches version mismatches across workspaces |
| Lefthook | latest | Git hooks manager | Go-based, parallel execution, native monorepo support, pnpm compatible |
| Wrangler | 4.63.0 | Cloudflare CLI | Deploy Workers, manage D1, generate types, preview URLs |
| Node.js | 22 LTS | Runtime | Long-term support, required by project decision |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Vitest | 3.2.0 | Test runner | Unit tests across all packages |
| @cloudflare/vitest-pool-workers | 0.12.1 | Workers test pool | Integration tests running in actual Workers runtime |
| @vitest/coverage-v8 | 3.2.0 | Coverage reporting | Generate coverage reports (no threshold enforcement) |
| tsx | 4.21.0 | TypeScript execution | Run scripts without compilation |
| rimraf | 6.1.2 | Cross-platform rm | Clean build artifacts |
| cloudflare/wrangler-action | v3 | GitHub Action | Deploy Workers in CI/CD workflows |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Biome | ESLint + Prettier | Two tools, slower, more config; Biome is user's locked decision |
| Knip | ts-prune | Knip covers files + deps + exports; ts-prune only covers exports |
| Sherif | check-dependency-version-consistency | Sherif is faster (Rust), zero-config, actively maintained |
| Lefthook | Husky + lint-staged | Lefthook is single tool, parallel execution, no npm dependency chain |
| pnpm catalogs | Syncpack | Catalogs are native to pnpm, no extra tool needed |

**Installation (root devDependencies):**
```bash
pnpm add -D @biomejs/biome@2.3.14 knip@5.83.0 lefthook typescript@5.9.3 vitest@3.2.0 @vitest/coverage-v8@3.2.0 tsx@4.21.0 rimraf@6.1.2 wrangler@4.63.0
```

**Note:** Sherif is run via `pnpm dlx sherif@latest` (or pinned version in CI) -- it does not need to be installed as a dependency.

## Architecture Patterns

### Recommended Project Structure
```
downtown65-ecosystem/
├── .github/
│   └── workflows/
│       ├── pr-checks.yml          # PR: lint, typecheck, knip, test, build, preview deploy
│       ├── pr-cleanup.yml         # PR closed/merged: delete preview workers + D1
│       └── deploy.yml             # Merge to main: production deploy all 3 apps
├── apps/
│   ├── api/                       # Hono API on Cloudflare Workers
│   │   ├── src/
│   │   ├── __tests__/
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json          # extends ../../tsconfig.base.json
│   │   ├── vitest.config.ts
│   │   └── package.json           # @dt65/api
│   ├── events/                    # React Router 7 events app
│   │   ├── src/
│   │   │   └── app/
│   │   ├── __tests__/
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json           # @dt65/events
│   └── www/                       # Astro static site
│       ├── src/
│       ├── __tests__/
│       ├── wrangler.jsonc
│       ├── tsconfig.json
│       └── package.json           # @dt65/www
├── packages/
│   └── shared/                    # Shared types, utilities, constants
│       ├── src/
│       │   └── index.ts           # Barrel export (public API)
│       ├── __tests__/
│       ├── tsconfig.json
│       └── package.json           # @dt65/shared
├── biome.json                     # Root Biome config
├── knip.json                      # Knip config (auto-discovers workspaces)
├── lefthook.yml                   # Git hooks config
├── tsconfig.base.json             # Shared TypeScript config
├── tsconfig.json                  # Root project references
├── pnpm-workspace.yaml            # Workspace + catalog definitions
├── package.json                   # Root scripts + shared devDeps
├── .gitignore
├── .npmrc
└── CLAUDE.md                      # Claude AI development guide
```

### Pattern 1: pnpm Workspace with Catalogs

**What:** Centralize all dependency versions in `pnpm-workspace.yaml` using the catalog protocol. Each `package.json` references `catalog:` instead of version ranges.

**When to use:** Always -- this is the primary dependency management pattern.

**Configuration:**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"

onlyBuiltDependencies:
  - lefthook

catalog:
  "@biomejs/biome": 2.3.14
  "@cloudflare/vitest-pool-workers": 0.12.1
  "@hono/zod-openapi": 1.2.1
  "@types/node": 25.0.3
  "@vitest/coverage-v8": 3.2.0
  jwt-decode: 4.0.0
  knip: 5.83.0
  rimraf: 6.1.2
  tsx: 4.21.0
  typescript: 5.9.3
  vitest: 3.2.0
  wrangler: 4.63.0
  zod: 4.3.5
```

```json
// apps/api/package.json
{
  "name": "@dt65/api",
  "private": true,
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "wrangler": "catalog:",
    "vitest": "catalog:"
  }
}
```

Source: https://pnpm.io/catalogs

### Pattern 2: TypeScript Project References

**What:** Use composite projects with project references so `tsc --build` can incrementally compile across workspaces. Each app extends `tsconfig.base.json` and declares references to shared packages.

**When to use:** For incremental builds and cross-workspace type checking.

**Configuration:**

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  }
}
```

```json
// tsconfig.json (root -- project references only)
{
  "files": [],
  "references": [
    { "path": "apps/api" },
    { "path": "apps/events" },
    { "path": "apps/www" },
    { "path": "packages/shared" }
  ]
}
```

```json
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
```

Source: https://www.typescriptlang.org/tsconfig/

### Pattern 3: Biome v2 Monorepo Configuration

**What:** Root `biome.json` sets strict defaults. Apps can create nested `biome.json` with `extends: "//"` to inherit root config and override specific rules (e.g., allowing console in scripts).

**When to use:** Always -- provides consistent code quality across all packages.

**Configuration:**

```json
// biome.json (root)
{
  "$schema": "https://biomejs.dev/schemas/2.3.14/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": "error",
      "suspicious": "error",
      "style": "warn",
      "complexity": "warn",
      "performance": "error"
    }
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

The `noConsole` rule is configured under `linter.rules.suspicious`:

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "error"
      }
    }
  }
}
```

Source: https://biomejs.dev/guides/big-projects/

### Pattern 4: Per-PR Preview Deploy Strategy

**What:** On PR open, deploy each of the 3 apps as separate preview Workers with PR-number-prefixed names, create a per-PR D1 database, run migrations. On PR close, clean up all preview resources.

**When to use:** PR checks workflow and PR cleanup workflow.

**Approach:**

```yaml
# PR Checks workflow (simplified)
- name: Create PR D1 database
  run: |
    DB_NAME="dt65-pr-${{ github.event.pull_request.number }}"
    wrangler d1 create "$DB_NAME" || true
    DB_ID=$(wrangler d1 list --json | jq -r ".[] | select(.name == \"$DB_NAME\") | .uuid")
    echo "DB_ID=$DB_ID" >> $GITHUB_ENV

- name: Deploy API preview
  uses: cloudflare/wrangler-action@v3
  with:
    command: versions upload --preview-alias pr-${{ github.event.pull_request.number }}
    workingDirectory: apps/api
```

```yaml
# PR Cleanup workflow (simplified)
- name: Delete preview Workers
  run: |
    PR_NUM=${{ github.event.pull_request.number }}
    wrangler delete --name "dt65-api-pr-${PR_NUM}" || true
    wrangler delete --name "dt65-events-pr-${PR_NUM}" || true
    wrangler delete --name "dt65-www-pr-${PR_NUM}" || true

- name: Delete PR D1 database
  run: |
    wrangler d1 delete "dt65-pr-${PR_NUM}" || true
```

**Important:** There is no built-in "per-PR D1" feature in Cloudflare. This must be scripted using `wrangler d1 create` and `wrangler d1 delete`. The PR cleanup workflow is essential to avoid resource leakage.

Source: https://developers.cloudflare.com/workers/configuration/previews/

### Pattern 5: Lefthook Pre-Push Configuration

**What:** Run lint, typecheck, and knip as pre-push hooks. Use parallel execution for speed.

**Configuration:**

```yaml
# lefthook.yml
pre-push:
  parallel: true
  jobs:
    - name: lint
      run: pnpm biome check .

    - name: typecheck
      run: pnpm tsc --build --noEmit

    - name: knip
      run: pnpm knip
```

Source: https://lefthook.dev/

### Anti-Patterns to Avoid

- **Path-based CI filtering:** User explicitly decided against it. Run all checks on all apps for every PR even though only one app changed. The repo is small enough that this is fast.
- **Merge commits or squash merging:** User decided on rebase merging only. Configure branch protection to enforce this.
- **Staging environment:** User explicitly decided no staging. CI checks + Cloudflare instant rollback is sufficient.
- **Global `@/` alias across packages:** Each app should have its own `@/` path alias pointing to its own `src/`. Never use `@/` in shared packages -- it would create conflicts.
- **Installing Sherif as a dependency:** Run it via `pnpm dlx sherif@latest`. It does not need `node_modules` and is faster standalone.
- **Using `biome.json` `"all": true` in v2:** This syntax changed in Biome v2. Use group-level severity instead: `"correctness": "error"`, `"suspicious": "error"`, etc.
- **Ignoring `onlyBuiltDependencies` for Lefthook with pnpm:** Without this setting in `pnpm-workspace.yaml`, Lefthook's postinstall hook won't run and git hooks won't be installed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency version sync | Custom script to check versions | pnpm catalogs + Sherif | Catalogs centralize versions; Sherif catches drift |
| Import sorting | Custom lint rule or manual sorting | Biome `organizeImports` assist | Built-in, consistent, auto-fixable |
| Dead code detection | grep for unused exports | Knip | Knip understands module graphs, plugins, entry points |
| Git hooks management | `.git/hooks/` scripts | Lefthook | Parallel execution, cross-platform, team-sharable |
| Preview deploy URLs | Custom deploy script with naming | `wrangler versions upload --preview-alias` | Official Cloudflare feature, DNS-compatible aliases |
| CI workflow orchestration | Shell scripts with conditionals | GitHub Actions jobs + steps | Declarative, parallel jobs, built-in caching |

**Key insight:** Every tool in this stack is purpose-built for monorepos and has zero-config or minimal-config defaults. Custom solutions would add maintenance burden without benefit.

## Common Pitfalls

### Pitfall 1: Lefthook Not Installing Hooks with pnpm
**What goes wrong:** After `pnpm install`, no git hooks are created. Pre-push checks never run.
**Why it happens:** pnpm requires explicit opt-in for postinstall scripts via `onlyBuiltDependencies`.
**How to avoid:** Add `lefthook` to both `pnpm-workspace.yaml` `onlyBuiltDependencies` and `pnpm.onlyBuiltDependencies` in root `package.json`.
**Warning signs:** Running `ls .git/hooks/` shows no lefthook-managed hooks.

### Pitfall 2: Biome v2 Nested Config Not Inheriting
**What goes wrong:** App-level `biome.json` doesn't use root rules. Each app gets default Biome settings.
**Why it happens:** In Biome v2, nested configs don't inherit from root by default. You must use `"extends": "//"` explicitly.
**How to avoid:** Every nested `biome.json` must include `"extends": "//"` (which implies `"root": false`).
**Warning signs:** Running `biome check` in an app directory produces different results than from root.

### Pitfall 3: Per-PR D1 Database Resource Leakage
**What goes wrong:** Preview D1 databases accumulate and are never cleaned up, hitting Cloudflare account limits.
**Why it happens:** PR cleanup workflow is missing or fails silently (e.g., wrong database name, API error).
**How to avoid:** PR cleanup workflow must run on `pull_request: closed` (covers both merge and close). Use `|| true` to avoid failing on already-deleted resources. Log cleanup actions for debugging.
**Warning signs:** Growing list of D1 databases visible in Cloudflare dashboard.

### Pitfall 4: `catalog:` Protocol in CI
**What goes wrong:** CI build fails because pnpm version doesn't support catalogs.
**Why it happens:** Using an older pnpm version that predates catalog support (< 9.5).
**How to avoid:** Pin pnpm version in `package.json` `packageManager` field and use `pnpm/action-setup` in CI.
**Warning signs:** Error: `Unsupported protocol "catalog:"` during `pnpm install`.

### Pitfall 5: TypeScript `exactOptionalPropertyTypes` Breaks Third-Party Types
**What goes wrong:** Type errors in third-party library type definitions when `exactOptionalPropertyTypes` is enabled.
**Why it happens:** Many libraries declare `prop?: string` but assign `undefined` explicitly, which `exactOptionalPropertyTypes` forbids.
**How to avoid:** Enable `skipLibCheck: true` (already in the recommended config). This skips checking `.d.ts` files from `node_modules`.
**Warning signs:** Type errors pointing to files inside `node_modules/`.

### Pitfall 6: Knip False Positives in Monorepo
**What goes wrong:** Knip reports barrel exports, config files, or framework entry points as unused.
**Why it happens:** Knip doesn't recognize framework-specific patterns without the right plugins.
**How to avoid:** Run `knip` first, address configuration hints before actual issues. Enable appropriate plugins per workspace. Use `includeEntryExports` for shared packages with barrel exports.
**Warning signs:** Knip reports `index.ts` re-exports as unused.

### Pitfall 7: `@/` Path Alias Not Working at Runtime
**What goes wrong:** TypeScript compiles fine but runtime fails to resolve `@/` imports.
**Why it happens:** `tsconfig.json` `paths` only helps TypeScript; the bundler (Vite/Wrangler) also needs configuration.
**How to avoid:** Configure path aliases in both `tsconfig.json` and the bundler config (e.g., Vite `resolve.alias` or Wrangler's built-in TypeScript paths support). Wrangler respects `tsconfig.json` paths natively.
**Warning signs:** `MODULE_NOT_FOUND` errors during `wrangler dev` or `vite dev`.

### Pitfall 8: CI Environment Variable Prevents Lefthook Install
**What goes wrong:** In CI, lefthook tries to install git hooks during `pnpm install`, which is unnecessary.
**Why it happens:** Lefthook's postinstall script runs in CI too.
**How to avoid:** Ensure `CI=true` is set in your GitHub Actions environment (GitHub Actions sets this automatically). Lefthook's postinstall detects `CI=true` and skips hook installation.
**Warning signs:** CI logs showing `lefthook install` output during the install step.

## Code Examples

Verified patterns from official sources:

### Root package.json Scripts
```json
{
  "name": "@dt65/root",
  "private": true,
  "packageManager": "pnpm@10.4.1",
  "scripts": {
    "build": "pnpm -r run build",
    "check": "biome check . && pnpm knip && pnpm dlx sherif@latest",
    "lint": "biome check --write .",
    "typecheck": "tsc --build",
    "test": "pnpm -r run test",
    "clean": "pnpm -r run clean"
  },
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "knip": "catalog:",
    "lefthook": "latest",
    "typescript": "catalog:"
  }
}
```

Source: https://pnpm.io/workspaces

### Shared Package Configuration
```json
// packages/shared/package.json
{
  "name": "@dt65/shared",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:",
    "rimraf": "catalog:"
  }
}
```

### Knip Configuration
```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    ".": {
      "entry": "scripts/*.ts",
      "ignoreDependencies": ["lefthook"]
    },
    "apps/api": {
      "entry": "src/index.ts"
    },
    "apps/events": {},
    "apps/www": {},
    "packages/shared": {
      "includeEntryExports": true
    }
  }
}
```

Source: https://knip.dev/features/monorepos-and-workspaces

### Sherif Configuration (optional, in root package.json)
```json
{
  "sherif": {
    "ignoreRule": [],
    "ignoreDependency": [],
    "ignorePackage": []
  }
}
```

Source: https://github.com/QuiiBz/sherif

### Wrangler Configuration (per app)
```jsonc
// apps/api/wrangler.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "dt65-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-01",
  "compatibility_flags": ["nodejs_compat_v2"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dt65-production",
      "database_id": "<PRODUCTION_DB_ID>"
    }
  ],
  "observability": {
    "enabled": true
  }
}
```

Source: https://developers.cloudflare.com/workers/wrangler/configuration/

### GitHub Actions PR Checks Workflow (skeleton)
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome check .
      - run: pnpm tsc --build
      - run: pnpm knip
      - run: pnpm dlx sherif@latest
      - run: pnpm test
      - run: pnpm build

  preview-deploy:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # Create per-PR D1 database
      # Deploy each app as preview Worker
      # Comment preview URLs on PR
```

Source: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier | Biome | 2024+ | Single tool, 10-100x faster, native monorepo in v2 |
| Husky + lint-staged | Lefthook | 2023+ | Single binary, parallel execution, better monorepo support |
| Manual version sync (Syncpack) | pnpm catalogs | pnpm 9.5 (2024) | Native to package manager, no extra tool |
| `wrangler.toml` | `wrangler.jsonc` | Wrangler v3+ | JSON config supports newer features, better IDE support |
| `wrangler deploy` for previews | `wrangler versions upload --preview-alias` | Wrangler 4.21.0 | Proper preview URLs without deploying to production route |
| Biome `"all": true` | Group-level severity (`"correctness": "error"`) | Biome v2 | More granular control, nursery rules excluded for stability |

**Deprecated/outdated:**
- `wrangler.toml` is still supported but `wrangler.jsonc` is preferred for new projects (newer features are JSON-only)
- Biome's `noConsoleLog` rule is deprecated; use `noConsole` instead
- `@evilmartians/lefthook` npm package is legacy; use `lefthook` package directly
- `"all": true` syntax in Biome v2 linter config no longer works; use group-level severity

## Open Questions

1. **Per-PR D1 database creation in CI**
   - What we know: `wrangler d1 create` and `wrangler d1 delete` exist. No built-in per-PR provisioning. CI scripts must manage lifecycle.
   - What's unclear: Whether D1 database creation has rate limits or quotas per account. Whether running migrations on a fresh D1 in CI is fast enough. Whether the PR cleanup workflow reliably catches all edge cases (force-close, abandoned PRs).
   - Recommendation: Implement the create/delete approach. Add a scheduled workflow to garbage-collect orphaned preview databases older than 7 days. Test cleanup thoroughly.

2. **Preview deploy approach: `wrangler versions upload --preview-alias` vs deploying as separate Workers**
   - What we know: `--preview-alias` creates versioned preview URLs on the same Worker. Deploying separate Workers (e.g., `dt65-api-pr-123`) creates fully independent Workers. The user wants "all 3 apps get preview deploys."
   - What's unclear: Whether `--preview-alias` properly supports D1 bindings pointing to a different (PR-specific) database. Separate Workers may be simpler for full isolation.
   - Recommendation: Use separate Workers with PR-number naming (e.g., `dt65-api-pr-123`) for full isolation including separate D1 bindings. This is easier to reason about and clean up. The `--preview-alias` approach is better for single-worker previews without binding changes.

3. **Biome rule exceptions needed**
   - What we know: `noConsole` should be `"error"` in source, but test files and scripts may need `console.log`.
   - What's unclear: The exact set of rules that will need exceptions once real code is written.
   - Recommendation: Start with strict defaults. Create nested `biome.json` in test directories or scripts if needed, overriding `noConsole` to `"off"`. This is Claude's discretion per user decision.

4. **Exact pnpm version for `packageManager` field**
   - What we know: pnpm 10.x is current. Catalogs require pnpm >= 9.5.
   - What's unclear: The exact latest stable pnpm 10.x version at implementation time.
   - Recommendation: Use `pnpm@10.4.1` or whatever the latest 10.x is at implementation time. Pin it in `package.json` `packageManager` field.

## Sources

### Primary (HIGH confidence)
- [pnpm Catalogs](https://pnpm.io/catalogs) - catalog protocol, configuration, publishing behavior
- [pnpm Workspaces](https://pnpm.io/workspaces) - workspace configuration, package.json setup
- [Biome Big Projects](https://biomejs.dev/guides/big-projects/) - monorepo support, `extends: "//"`, nested configs
- [Biome Configuration Reference](https://biomejs.dev/reference/configuration/) - formatter, linter, rule groups
- [Biome Linter](https://biomejs.dev/linter/) - rule presets, group severity, recommended vs all
- [Biome organizeImports](https://biomejs.dev/assist/actions/organize-imports/) - import sorting configuration
- [Biome noConsole](https://biomejs.dev/linter/rules/no-console/) - console.log ban rule
- [Knip Monorepos & Workspaces](https://knip.dev/features/monorepos-and-workspaces) - workspace auto-discovery, per-workspace config
- [Sherif GitHub](https://github.com/QuiiBz/sherif) - rules, configuration, CI integration
- [Lefthook GitHub](https://github.com/evilmartians/lefthook) - configuration, pre-push hooks, parallel execution
- [Lefthook Node.js Installation](https://lefthook.dev/installation/node.html) - pnpm onlyBuiltDependencies requirement
- [Cloudflare Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) - workflow setup
- [Cloudflare Workers Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/) - preview-alias, versioned URLs
- [Cloudflare D1 Environments](https://developers.cloudflare.com/d1/configuration/environments/) - per-environment database binding
- [Wrangler Action GitHub](https://github.com/cloudflare/wrangler-action) - inputs, outputs, deployment examples
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) - tsconfig improvements
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/) - strict options, project references

### Secondary (MEDIUM confidence)
- [Biome v2 "all" rules discussion](https://github.com/biomejs/biome/discussions/5512) - group-level severity replaces `all: true`
- [Wrangler Action v3 releases](https://github.com/cloudflare/wrangler-action/releases) - version compatibility

### Tertiary (LOW confidence)
- Per-PR D1 database pattern - constructed from individual feature documentation; no official end-to-end guide exists. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are well-documented, user has locked specific versions
- Architecture: HIGH - pnpm workspaces + Biome v2 monorepo support are officially documented patterns
- CI/CD pipeline: MEDIUM - Preview deploy and per-PR D1 patterns require custom scripting; no official end-to-end guide
- Pitfalls: HIGH - Based on official documentation warnings and known issues

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable tooling, versions locked)
