# Commands

```bash
pnpm dev                  # Start all apps in parallel (wrangler dev)
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

## Local Development

1. `pnpm install`
2. Copy `.env.local` example values in each app (see `.env.schema` for required vars)
3. `pnpm dev` — starts all 3 Workers locally via `wrangler dev`

Each app runs on a different port (wrangler auto-assigns). Local D1 databases are created automatically in `.wrangler/` (gitignored).
