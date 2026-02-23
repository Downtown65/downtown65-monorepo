# Downtown 65 Ecosystem

DT65 sports club ecosystem -- 3 Cloudflare Workers apps + shared package in a pnpm monorepo.

## Architecture

```
apps/api       (@dt65/api)     Hono API on Cloudflare Workers (D1, Auth0 JWT)
apps/events    (@dt65/events)  React Router 7 PWA (Mantine, Auth0 Lock)
apps/www       (@dt65/www)     Astro static site (Tailwind)
packages/shared (@dt65/shared) Shared types, utilities, constants
```

## Tech Stack

- **Runtime:** Cloudflare Workers, D1 (SQLite), Node.js 22 LTS
- **Package manager:** pnpm 10.x with workspace catalogs
- **Language:** TypeScript 5.9 (strict mode)
- **Linting/formatting:** Biome 2.x (strict, 2-space indent, semicolons, single quotes)
- **Dead code detection:** Knip (strict, zero unused tolerance)
- **Dependency consistency:** Sherif (pinned in catalog, run via `pnpm sherif`)
- **Git hooks:** Lefthook (pre-push: lint, typecheck, knip)
- **Testing:** Vitest + @cloudflare/vitest-pool-workers for integration tests
- **CI/CD:** GitHub Actions -- PR checks + preview deploy, auto-deploy on merge to main

## Commands

```bash
pnpm install              # Install all workspace dependencies
pnpm build                # Build all apps (wrangler dry-run)
pnpm check                # ci:lint + knip + sherif (full quality check)
pnpm lint                 # Biome lint (check only, all workspaces)
pnpm format               # Biome check with auto-fix (all workspaces)
pnpm ci:lint              # Biome CI mode (all workspaces)
pnpm typecheck            # TypeScript build mode (all workspaces)
pnpm test                 # Run all tests across workspaces
pnpm clean                # Remove dist/ in all workspaces
```

Per-workspace scripts (available in each app/package):
```bash
pnpm run lint             # biome lint (check only)
pnpm run format           # biome check --write (auto-fix)
pnpm run ci:lint          # biome ci (CI-friendly output)
```

Per-app dev workflow:
```bash
pnpm --filter @dt65/api dev       # Start API dev server
pnpm --filter @dt65/events dev    # Start events dev server
pnpm --filter @dt65/www dev       # Start www dev server
```

## Coding Conventions

### Commits and Branches

- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:` with optional scope
- **Branch naming:** `type/description` (e.g., `feat/event-crud`, `fix/login-error`)
- **Merge strategy:** Rebase only (no merge commits, no squash)
- **Pull config:** `git config pull.rebase true`

### File Naming

- PascalCase for React components: `EventList.tsx`, `LoginPage.tsx`
- kebab-case for everything else: `auth-middleware.ts`, `event-service.ts`

### Code Patterns

- **Tests:** Place in `__tests__/` directories mirroring source structure
- **Path aliases:** `@/` prefix for internal imports within each app (NOT in shared)
- **Error handling:** Result types `{ ok: true, data } | { ok: false, error }` -- no throw/catch for business logic
- **External deps:** Interface pattern -- interface + implementation (e.g., `AuthenticationService` / `Auth0Service`)
- **Env validation:** Zod validation for all `c.env` bindings at app startup -- fail fast if anything missing
- **Logging:** No `console.log` -- use structured logger (Biome enforces `noConsole`)
- **Imports:** Biome auto-sorts imports

### TypeScript

- `strict: true` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- `verbatimModuleSyntax: true` -- use `import type` for type-only imports
- `composite: true` + `incremental: true` for project references
- `skipLibCheck: true` -- skip checking third-party `.d.ts` files

### Dependencies

- All versions pinned in `pnpm-workspace.yaml` catalog
- Use `catalog:` protocol in package.json -- never hardcode versions
- Add new shared versions to the catalog section in `pnpm-workspace.yaml`
- Root devDependencies for shared tooling (biome, knip, typescript)
- App-specific dependencies in each app's package.json

## Pre-push Hooks

Lefthook runs these checks on `git push` (parallel):
1. `pnpm ci:lint` -- Biome CI check (all workspaces)
2. `pnpm tsc --build` -- typecheck all workspaces
3. `pnpm knip` -- dead code detection

Fix all errors before pushing. Run `pnpm check` to verify locally.

## Project References

The monorepo uses TypeScript project references for incremental builds:
- Root `tsconfig.json` references all 4 workspaces
- Each app's `tsconfig.json` extends `tsconfig.base.json` and references `packages/shared`
- Use `tsc --build` (not `tsc --noEmit`) for full workspace typechecking
- `.tsbuildinfo` files are gitignored -- they are build cache artifacts

## Workspace Structure

- `apps/*` -- deployable applications (Cloudflare Workers)
- `packages/*` -- shared libraries consumed by apps
- Shared package uses barrel exports (`src/index.ts` re-exports public API)
- Each app declares `@dt65/shared` as `workspace:*` dependency
