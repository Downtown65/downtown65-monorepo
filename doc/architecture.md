# Architecture

DT65 sports club ecosystem -- 3 Cloudflare Workers apps + shared package in a pnpm monorepo.

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

## Workspace Structure

- `apps/*` -- deployable applications (Cloudflare Workers)
- `packages/*` -- shared libraries consumed by apps
- Shared package uses barrel exports (`src/index.ts` re-exports public API)
- Each app declares `@dt65/shared` as `workspace:*` dependency
