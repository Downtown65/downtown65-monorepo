# CI & Build

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
