# Coding Conventions

## Commits and Branches

- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:` with optional scope
- **Branch naming:** `type/description` (e.g., `feat/event-crud`, `fix/login-error`)
- **Merge strategy:** Rebase only (no merge commits, no squash)
- **Pull config:** `git config pull.rebase true`

## File Naming

- PascalCase for React components: `EventList.tsx`, `LoginPage.tsx`
- kebab-case for everything else: `auth-middleware.ts`, `event-service.ts`

## Code Patterns

- **Tests:** Place in `__tests__/` directories mirroring source structure
- **Path aliases:** `@/` prefix for internal imports within each app (NOT in shared)
- **Error handling:** Result types `{ ok: true, data } | { ok: false, error }` -- no throw/catch for business logic
- **External deps:** Interface pattern -- interface + implementation (e.g., `AuthenticationService` / `Auth0Service`)
- **Env vars:** VarLock manages all environment variables -- see [environment.md](environment.md)
- **Logging:** No `console.log` -- use structured logger (Biome enforces `noConsole`)
- **Imports:** Biome auto-sorts imports

## TypeScript

- `strict: true` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- `verbatimModuleSyntax: true` -- use `import type` for type-only imports
- `composite: true` + `incremental: true` for project references
- `skipLibCheck: true` -- skip checking third-party `.d.ts` files
- **No `as` casts** -- validate external data with Zod at system boundaries (API responses, JSON.parse, FormData). Use type guards or `String()`/`Number()` for narrowing. The only acceptable `as` is `as const`.

## Dependencies

- Dependencies used across multiple packages go in `pnpm-workspace.yaml` catalog with `catalog:` protocol
- App-specific dependencies (used in one place only) can use hardcoded versions directly
- Root devDependencies for shared tooling (biome, knip, typescript)
- App-specific dependencies in each app's package.json
