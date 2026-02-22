# Stack Research

**Domain:** Sports club event management ecosystem (PWA + API + static site)
**Researched:** 2026-02-22
**Confidence:** HIGH (core stack validated from PROJECT.md; all choices are mainstream and well-documented)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| TypeScript | ~5.9.x | Language for all packages | Type safety across full stack; monorepo consistency. TS 6.0 beta exists but 5.9 is stable. Do NOT use TS 7 (Go-based) yet -- still in preview. | HIGH |
| Hono | ^4.12.x | API framework on Workers | Ultra-lightweight (14KB), built for edge runtimes, native Cloudflare Workers support, built-in JWT/JWK middleware, type-safe RPC client for frontend consumption. The standard choice for CF Workers APIs. | HIGH |
| React Router | ^7.13.x | Events PWA framework | Full-stack React framework (formerly Remix). First-class Cloudflare Workers support via `@react-router/cloudflare`. SSR + client hydration for PWA. Officially supported by Cloudflare Vite plugin. | HIGH |
| Astro | ^5.16.x (stable 5.x) | Static website (www) | Content-focused, ships zero JS by default, Cloudflare adapter is mature (`@astrojs/cloudflare`). Do NOT use Astro 6 yet -- still in beta. Astro 5 has full Cloudflare Workers support since 5.6. | HIGH |
| Drizzle ORM | ^0.45.x | Database ORM for D1 | Type-safe SQL, first-class D1 support, generates migrations compatible with `wrangler d1 migrations apply`. Lightweight, no runtime overhead. Production-ready for D1. | HIGH |
| Cloudflare D1 | N/A (service) | SQLite database | Managed SQLite at the edge, free tier generous for ~100 members. Supports read replicas, sessions for consistency. 10GB per database limit is more than sufficient. | HIGH |
| Mantine | ^8.3.x | UI component library (events app) | Full-featured React component library with 100+ components. Has official React Router integration guide. v8 is stable; v9 alpha exists but ships May 2026 -- too early. | HIGH |
| Tailwind CSS | ^4.x | Styling (static site) | v4 is stable (released Jan 2025). 5x faster builds, zero-config CSS-first setup. Use for Astro site; Mantine handles events app styling. | HIGH |

### Runtime & Build Infrastructure

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Wrangler | ^4.67.x | CF Workers CLI, D1 management, local dev | Official Cloudflare CLI. v4 is current (v3 supported until Q1 2027). Handles deployments, D1 migrations, local dev with miniflare. | HIGH |
| Vite | ^7.3.x | Build tool | Powers React Router 7 and Astro builds. v7 is stable. Do NOT use v8 beta (Rolldown-powered, not production-ready). | HIGH |
| @cloudflare/vite-plugin | ^1.25.x | Vite-Workers integration | Runs Worker code in workerd locally, matching production. Required for React Router 7 on CF Workers. GA and stable. | HIGH |
| pnpm | ^10.30.x | Package manager | Strict node_modules prevents phantom deps, content-addressable store saves disk, built-in workspace support. v10 is stable with "security by default." | HIGH |
| Node.js | ^22.x LTS | Development runtime | Required by Wrangler 4, Vite 7. Use current LTS (22.x). Node 20 is minimum but 22 is recommended. | HIGH |

### API Layer Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @hono/zod-openapi | ^1.2.x | OpenAPI schema generation | Define all API routes. Validates request/response with Zod, generates OpenAPI spec. **IMPORTANT: Use Zod v3 (^3.23.x), NOT Zod v4.** The @hono/zod-openapi package does not yet support Zod v4 (tracked in honojs/middleware#1177). | HIGH |
| zod | ^3.23.x | Schema validation | Shared validation schemas between API and frontend. Pin to v3 until @hono/zod-openapi supports v4. | HIGH |
| hono/jwt | built-in | JWT verification middleware | Auth0 token verification. Hono has built-in JWT and JWK middleware. Use `jwk()` middleware with Auth0 JWKS endpoint. Set explicit algorithm allowlist (RS256) per 2025 security fix. | HIGH |
| drizzle-kit | ^0.31.x | Migration generation | Generate SQL migrations from Drizzle schema. Apply via `wrangler d1 migrations apply` in CI/CD. | HIGH |
| hc (Hono Client) | built-in | Type-safe API client | Export `AppType` from Hono API, import in React Router app for end-to-end type safety. Eliminates manual API type definitions. | HIGH |

### Email & Scheduling

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| AWS SES v2 API (direct) | N/A | Email sending | Call SES API directly via fetch() -- do NOT use @aws-sdk/client-ses (too large for Workers, incompatible runtime). Sign requests with AWS Signature V4 manually or use a lightweight signing utility. | MEDIUM |
| Cloudflare Cron Triggers | N/A (config) | Scheduled email digests | Monday morning weekly digest. Configure in wrangler.json `[triggers]`. Uses `scheduled()` handler. Free, no extra cost. | HIGH |
| Cloudflare Queues | N/A (service) | Async email processing | Queue new-event notifications for reliable delivery with retries. Prevents email failures from blocking API responses. Free tier: 1M messages/month. | MEDIUM |

### Testing

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Vitest | ^3.x (NOT v4) | Unit & integration testing | Use Vitest 3.x because `@cloudflare/vitest-pool-workers` does NOT yet support Vitest 4 (tracked in cloudflare/workers-sdk#11064). Vitest 3 is mature and stable. | HIGH |
| @cloudflare/vitest-pool-workers | ^0.12.x | Workers runtime testing | Run tests inside workerd (same as production). Use for API integration tests with D1 bindings. Supports Vitest 2.0.x - 3.2.x. | HIGH |
| Playwright | ^1.58.x | E2E browser testing | Test full user flows in the events PWA. Chromium, Firefox, WebKit. Use for critical paths: login, create event, join event. | HIGH |

### Code Quality & DX

| Tool | Version | Purpose | Notes | Confidence |
|------|---------|---------|-------|------------|
| Biome | ^2.3.x | Linting + formatting | Replaces ESLint + Prettier. 10-25x faster, single config file (`biome.json`). 449 lint rules including type-aware linting. Handles TS, JS, JSON, CSS. | HIGH |
| Knip | ^5.85.x | Dead code & dependency detection | Finds unused files, exports, dependencies. Has plugins for Astro, Vitest, and more. Run in CI to prevent drift. | HIGH |
| Sherif | ^1.8.x | Monorepo consistency linting | Zero-config, Rust-based. Enforces consistent dependency versions, proper workspace protocol usage. Essential for pnpm workspaces. | HIGH |
| Lefthook | ^2.1.x | Git hooks manager | Fast (written in Go), parallel hook execution. Configure pre-push: biome check, tsc, knip. Replaces Husky with better perf and config. | HIGH |

### Auth

| Technology | Version | Purpose | Notes | Confidence |
|------------|---------|---------|-------|------------|
| Auth0 | N/A (service) | Identity provider | Already hosts user data, free for ~100 members. Workers verify JWTs from Auth0 using Hono's built-in JWK middleware against `https://{tenant}.auth0.com/.well-known/jwks.json`. | HIGH |

## Monorepo Structure

```
downtown65-ecosystem/
  packages/
    api/              # Hono API on CF Workers (wrangler.json)
    web/              # React Router 7 events PWA (vite.config.ts + wrangler.json)
    www/              # Astro static site (astro.config.ts)
    db/               # Drizzle schema, migrations, seed data
    shared/           # Shared Zod schemas, types, constants
    email/            # Email templates, SES integration
  tooling/
    tsconfig/         # Shared TypeScript configs
    biome-config/     # Shared Biome configuration (optional, can be root-level)
  pnpm-workspace.yaml
  biome.json          # Root Biome config
  lefthook.yml        # Git hooks config
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| API framework | Hono | ElysiaJS | Elysia is Bun-native, not designed for CF Workers. Hono is built for edge runtimes. |
| API framework | Hono | itty-router | itty-router is minimal but lacks middleware ecosystem, OpenAPI support, RPC client. |
| Database ORM | Drizzle | Prisma | Prisma client is too large for Workers (bundle size). Drizzle is SQL-first and lightweight. |
| Database ORM | Drizzle | Kysely | Kysely is good but Drizzle has better D1-specific tooling (drizzle-kit, studio) and migration workflow. |
| UI library | Mantine | shadcn/ui | shadcn/ui requires copy-pasting components. Mantine is a proper library with consistent API, better for small team velocity. Already chosen by project. |
| UI library | Mantine | MUI (Material UI) | MUI is heavier, Material Design aesthetic. Mantine is lighter, more customizable, better DX. |
| Linting | Biome | ESLint + Prettier | Biome is 10-25x faster, single tool, single config. ESLint ecosystem is fragmenting (flat config migration). |
| Package manager | pnpm | npm/yarn | pnpm strict mode prevents phantom deps. Content-addressable store is faster. Native workspace support. |
| Git hooks | Lefthook | Husky + lint-staged | Lefthook is faster (Go binary), parallel execution, single config file, no extra lint-staged dependency. |
| Testing | Vitest | Jest | Vitest is native to Vite ecosystem, faster, ESM-first. CF Workers pool only supports Vitest. |
| Validation | Zod v3 | Zod v4 | @hono/zod-openapi does not yet support Zod v4. Stay on v3 until upstream adds support. |
| Frontend framework | React Router 7 | Next.js | Next.js targets Vercel, not CF Workers. React Router 7 has first-class Cloudflare support. |
| Static site | Astro 5 | Astro 6 | Astro 6 is still in beta. Astro 5 is stable with mature CF adapter. Upgrade to 6 when stable. |
| Vitest version | Vitest 3.x | Vitest 4.x | @cloudflare/vitest-pool-workers does not support Vitest 4 yet. Pin to 3.x until CF pool catches up. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @aws-sdk/client-ses | Too large for Workers bundle (~5MB), Node.js APIs incompatible with Workers runtime | Direct SES v2 API calls with AWS Signature V4 signing |
| Prisma | Client bundle too large for Workers edge runtime, slow cold starts | Drizzle ORM |
| Zod v4 | @hono/zod-openapi has no v4 support yet (open issue since May 2025) | Zod v3.23.x |
| Vitest 4 | @cloudflare/vitest-pool-workers does not support v4 (open issue) | Vitest 3.x |
| Astro 6 | Still in beta (announced Jan 2026), not production-ready | Astro 5.x (latest 5.16+) |
| TypeScript 7 | Go-based rewrite, still in preview, tooling ecosystem not ready | TypeScript 5.9.x |
| TypeScript 6.0 | Beta (Feb 2026), not yet stable | TypeScript 5.9.x |
| ESLint + Prettier | Slower, more complex config, fragmenting ecosystem | Biome 2.x |
| Husky | Slower than Lefthook, requires lint-staged as separate dep | Lefthook |
| Express/Fastify | Node.js-native, not designed for edge/Workers runtime | Hono |
| Turborepo/Nx | Overkill for small team, adds complexity. pnpm workspaces + scripts are sufficient for ~100 member club app. | pnpm workspaces with `--filter` |
| Next.js | Targets Vercel, CF Workers support is not first-class | React Router 7 with @react-router/cloudflare |
| Cloudflare Pages (legacy) | Being unified into Workers. New projects should use Workers directly with Vite plugin. | Cloudflare Workers + @cloudflare/vite-plugin |

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @cloudflare/vitest-pool-workers ^0.12.x | vitest 2.0.x - 3.2.x | Do NOT upgrade Vitest to 4.x until pool supports it |
| @hono/zod-openapi ^1.2.x | zod ^3.23.x | Do NOT use Zod v4 until upstream support lands |
| @react-router/cloudflare ^7.13.x | @cloudflare/vite-plugin ^1.x | Both required for RR7 on Workers |
| Vite ^7.3.x | @cloudflare/vite-plugin ^1.25.x | Plugin GA, stable with Vite 7 |
| Wrangler ^4.x | Node.js 20.19+ or 22.12+ | Wrangler 4 dropped Node 18 support |
| Astro ^5.16.x | @astrojs/cloudflare (latest 5.x compatible) | Mature adapter, stable since Astro 5.6 |
| Drizzle ORM ^0.45.x | drizzle-kit ^0.31.x | Always keep these versions in sync |
| Mantine ^8.3.x | React 18.x or 19.x | Works with React Router 7's React version |
| Tailwind CSS ^4.x | Astro 5.x | Zero-config integration via `@astrojs/tailwind` or CSS import |

## Key Architectural Decisions

### D1 Migration Workflow
1. Define schema in `packages/db/schema.ts` using Drizzle
2. Run `drizzle-kit generate` to create SQL migration files
3. Apply locally: `wrangler d1 migrations apply DB_NAME --local`
4. Apply to production: `wrangler d1 migrations apply DB_NAME --remote` (in CI/CD)
5. Drizzle-generated migrations are compatible with Wrangler's migration runner

### Hono RPC for Type-Safe Frontend-Backend
1. Define API routes with `@hono/zod-openapi` in `packages/api`
2. Export `type AppType = typeof app` from API
3. Import `AppType` in `packages/web` and use `hc<AppType>()` client
4. Full type inference: request params, body, response -- no manual types

### Auth0 JWT Flow on Workers
1. Frontend (React Router) redirects to Auth0 login
2. Auth0 returns JWT access token
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. Hono JWK middleware fetches JWKS from Auth0, verifies token
5. Configure: explicit RS256 algorithm, audience validation, issuer check

### Email Architecture
1. **New event notification:** API handler queues message to CF Queue -> Queue consumer calls SES API
2. **Weekly digest:** Cron Trigger (Monday 06:00 UTC) -> scheduled() handler queries D1 for upcoming events -> calls SES API
3. **SES integration:** Direct HTTP calls to SES v2 API with AWS Sig V4 signing (no SDK)

## Installation

```bash
# Core API dependencies (packages/api)
pnpm add hono @hono/zod-openapi zod drizzle-orm

# Core web dependencies (packages/web)
pnpm add react react-dom @mantine/core @mantine/hooks @mantine/dates
pnpm add -D @react-router/cloudflare @react-router/dev @cloudflare/vite-plugin vite

# Core www dependencies (packages/www)
pnpm add astro @astrojs/cloudflare @astrojs/tailwind tailwindcss

# Database tooling (packages/db)
pnpm add drizzle-orm
pnpm add -D drizzle-kit

# Root dev dependencies
pnpm add -D -w typescript wrangler vitest @cloudflare/vitest-pool-workers
pnpm add -D -w @biomejs/biome knip sherif lefthook
pnpm add -D -w playwright @playwright/test
```

## CI/CD Pipeline (GitHub Actions)

```yaml
# Recommended workflow structure
# .github/workflows/ci.yml - on PR
#   1. pnpm install (with cache)
#   2. biome check (lint + format)
#   3. tsc --noEmit (all packages)
#   4. sherif (monorepo consistency)
#   5. knip (dead code detection)
#   6. vitest run (unit + integration with pool-workers)
#   7. playwright test (E2E, only on relevant changes)

# .github/workflows/deploy.yml - on push to main
#   1. Build packages
#   2. wrangler d1 migrations apply (production)
#   3. wrangler deploy (API worker)
#   4. wrangler deploy (web worker / React Router)
#   5. wrangler deploy (www worker / Astro)
#
# Use cloudflare/wrangler-action@v3 with CLOUDFLARE_API_TOKEN secret
# Use workingDirectory parameter for monorepo subdirectories
```

## Sources

- [Hono official docs](https://hono.dev/) -- framework features, RPC, JWT middleware (HIGH confidence)
- [Hono Cloudflare Workers guide](https://hono.dev/docs/getting-started/cloudflare-workers) (HIGH)
- [@hono/zod-openapi npm](https://www.npmjs.com/package/@hono/zod-openapi) -- v1.2.2, Zod v4 not yet supported (HIGH)
- [Zod v4 support issue #1177](https://github.com/honojs/middleware/issues/1177) -- open since May 2025 (HIGH)
- [React Router Cloudflare docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/) (HIGH)
- [React Router changelog](https://reactrouter.com/changelog) -- v7.13.x (HIGH)
- [Cloudflare Vite plugin docs](https://developers.cloudflare.com/workers/vite-plugin/) (HIGH)
- [@cloudflare/vite-plugin npm](https://www.npmjs.com/package/@cloudflare/vite-plugin) -- v1.25.2 (HIGH)
- [Drizzle ORM D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1) (HIGH)
- [Drizzle D1 HTTP API guide](https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit) (HIGH)
- [Cloudflare D1 docs](https://developers.cloudflare.com/d1/) (HIGH)
- [Cloudflare D1 best practices](https://developers.cloudflare.com/d1/best-practices/local-development/) (HIGH)
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) (HIGH)
- [Astro 6 beta announcement](https://astro.build/blog/astro-6-beta/) -- confirms Astro 6 not yet stable (HIGH)
- [Mantine React Router guide](https://mantine.dev/guides/react-router/) (HIGH)
- [Mantine changelog](https://mantine.dev/changelog/all-releases/) -- v8.3.15 stable (HIGH)
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) (HIGH)
- [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/) (HIGH)
- [Vitest 4 pool support issue #11064](https://github.com/cloudflare/workers-sdk/issues/11064) -- open (HIGH)
- [Playwright releases](https://github.com/microsoft/playwright/releases) -- v1.58.0 (HIGH)
- [Biome roadmap 2026](https://biomejs.dev/blog/roadmap-2026/) -- v2.3 current (HIGH)
- [Knip npm](https://www.npmjs.com/package/knip) -- v5.85.x (HIGH)
- [Sherif GitHub](https://github.com/QuiiBz/sherif) -- v1.8.0 (HIGH)
- [Lefthook GitHub](https://github.com/evilmartians/lefthook) -- v2.1.1 (HIGH)
- [Wrangler npm](https://www.npmjs.com/package/wrangler) -- v4.67.0 (HIGH)
- [Cloudflare wrangler-action](https://github.com/cloudflare/wrangler-action) -- v3 for GitHub Actions (HIGH)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (HIGH)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/) (HIGH)
- [Auth0 JWT verification on Workers](https://community.cloudflare.com/t/verify-auth0-token-in-worker-cloudflare/376471) (MEDIUM)
- [Hono JWK middleware](https://hono.dev/docs/middleware/builtin/jwk) -- built-in JWKS verification (HIGH)
- [AWS SES from Workers](https://www.ai.moda/en/blog/ses-emails-from-workers) -- direct API, no SDK (MEDIUM)
- [mail-worker SES example](https://github.com/winstxnhdw/mail-worker) -- SES v2 API pattern (MEDIUM)
- [pnpm workspaces docs](https://pnpm.io/workspaces) (HIGH)
- [TypeScript npm](https://www.npmjs.com/package/typescript) -- v5.9.3 stable (HIGH)

---
*Stack research for: Downtown 65 sports club event management ecosystem*
*Researched: 2026-02-22*
