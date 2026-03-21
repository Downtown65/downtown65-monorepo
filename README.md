# Downtown 65 Monorepo

Web ecosystem for the Downtown 65 sports club — an API, event management PWA, and public website, all deployed on Cloudflare Workers.

## Repository Structure

```
apps/api         @dt65/api      Hono API on Cloudflare Workers (D1, Auth0 JWT)
apps/events      @dt65/events   React Router 7 PWA (Mantine, Auth0 Lock)
apps/www         @dt65/www      Astro static site (Tailwind)
packages/shared  @dt65/shared   Shared types, utilities, constants
```

## Tech Stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Language         | TypeScript 5.9 (strict mode)                      |
| API              | Hono with OpenAPI (`@hono/zod-openapi`)           |
| Frontend         | React Router 7, Mantine UI                        |
| Static site      | Astro 6, Tailwind CSS 4                           |
| Validation       | Zod 4                                             |
| Auth             | Auth0 (JWT verification in API, Auth0 Lock in UI) |
| Runtime          | Cloudflare Workers                                |
| Database         | Cloudflare D1 (SQLite)                            |
| Secrets          | Infisical (via varlock)                            |
| Build            | Vite 7, Wrangler 4                                |

## Tooling

| Tool       | Purpose                                  |
| ---------- | ---------------------------------------- |
| pnpm 10.x | Package manager with workspace catalogs  |
| Biome 2.x  | Linting and formatting                   |
| Knip       | Dead code and unused dependency detection |
| Sherif     | Dependency consistency across workspaces |
| Vitest     | Testing (with `@cloudflare/vitest-pool-workers`) |
| Lefthook   | Git hooks (pre-push: lint, typecheck, knip) |
| Commitlint | Conventional Commits enforcement         |

## Infrastructure & CI/CD

All three apps deploy to **Cloudflare Workers** via **GitHub Actions**.

- **PR checks** — lint, typecheck, knip, sherif, test, build
- **Preview deploys** — per-PR Workers and D1 databases, preview URLs posted as PR comments
- **Production deploy** — triggered on merge to `main`
- **PR cleanup** — preview Workers and D1 databases deleted on PR close

## Getting Started

### Prerequisites

- Node.js 22+ (CI uses Node 24)
- pnpm 10.x

### Setup

```sh
pnpm install
```

### Development

```sh
pnpm dev          # Start all apps in parallel (wrangler dev)
```

### Quality Checks

```sh
pnpm check        # Full check: lint + knip + sherif
pnpm typecheck    # TypeScript build mode
pnpm test         # Run all tests
pnpm lint         # Biome lint
pnpm format       # Biome auto-fix
```

### Build

```sh
pnpm build        # Build all apps
pnpm clean        # Remove dist/ directories
```

## Conventions

- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`)
- **Branches** — `type/description` (e.g., `feat/event-crud`)
- **Naming** — PascalCase for React components, kebab-case for everything else
- **Imports** — `@/` path alias for internal imports
- **Errors** — Result types: `{ ok: true, data } | { ok: false, error }`
