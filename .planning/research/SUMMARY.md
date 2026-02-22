# Project Research Summary

**Project:** Downtown 65 Sports Club Event Management Ecosystem
**Domain:** Sports club event management (PWA + API + static site, ~100 members)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

The Downtown 65 (DT65) ecosystem is a purpose-built replacement for an existing AWS-based system serving a small Finnish sports club (~100 members). The product consists of three deployable units: a Hono API on Cloudflare Workers backed by D1 (SQLite), a React Router 7 PWA for event management, and an Astro static site for public club information. The entire stack runs on Cloudflare's edge platform with Auth0 for identity and AWS SES for email — a well-understood, lightweight architecture appropriate for this scale. The primary complexity is not feature richness but execution discipline: the monorepo toolchain must be set up correctly from the start, and the DynamoDB-to-D1 data migration requires careful schema redesign rather than a naive 1:1 port.

The recommended approach is to build in strict dependency order — shared types and D1 schema first, then the API, then the frontend SPA, then scheduled email jobs. Auth0 is the foundation upon which every user-facing feature depends and must be the first integration completed. Feature scope is deliberately narrow: Event CRUD, join/leave participation, email notifications, and mobile-responsive UI cover the full MVP. The most architecturally complex differentiator — external participant access for spinning class non-members — is intentionally deferred to v1.x after the migration is stable. Anti-features (native apps, real-time updates, payment processing, in-app chat) are explicitly out of scope and should be resisted through the project lifecycle.

The main risks are toolchain version compatibility traps (Zod v4/Vitest 4/Astro 6 all have upstream incompatibilities with key libraries — do NOT upgrade), D1 migration pitfalls (no rollback, no SQL transactions, must backup before every schema change), and Auth0 JWT key rotation handling (use `jose`'s `createRemoteJWKSet()`, never cache keys indefinitely). All three risks have clear prevention strategies that must be addressed in Phase 1 before any application logic is written.

## Key Findings

### Recommended Stack

The stack is entirely Cloudflare-native with the exception of Auth0 (existing tenant) and AWS SES (retained for email). Every technology choice has a specific rationale and documented compatibility constraint. The monorepo uses pnpm workspaces with Biome (linting + formatting), Lefthook (git hooks), Sherif (monorepo consistency), and Knip (dead code detection) — a complete DX toolchain that replaces the ESLint + Prettier + Husky combination with faster, simpler alternatives.

The single most important version constraint: use Zod v3 (not v4) because `@hono/zod-openapi` does not yet support Zod v4 (open issue since May 2025). Similarly, Vitest must stay at 3.x (not 4.x) because `@cloudflare/vitest-pool-workers` does not support Vitest 4. Astro must stay at 5.x (Astro 6 is beta). TypeScript stays at 5.9.x (TS 6.0 is beta, TS 7 is preview). These are not optional preferences — violating them breaks the build or deployment.

**Core technologies:**
- TypeScript 5.9.x: Language for all packages — type safety across full stack, monorepo consistency
- Hono 4.x: API framework on Cloudflare Workers — ultra-lightweight, native CF support, built-in JWT/JWK middleware, type-safe RPC client
- React Router 7: Events PWA — first-class Cloudflare Workers support, SSR + PWA, officially supported by Cloudflare Vite plugin
- Astro 5.x: Static website — content-focused, zero JS by default, mature Cloudflare adapter
- Drizzle ORM 0.45.x: Database ORM — type-safe SQL, first-class D1 support, migration-compatible with Wrangler
- Cloudflare D1: SQLite database — managed at the edge, free tier sufficient for ~100 members
- Mantine 8.x: UI component library — 100+ components, official React Router integration
- Zod 3.23.x: Schema validation — shared between API and frontend, pins to v3 due to hono/zod-openapi constraint
- Vitest 3.x + @cloudflare/vitest-pool-workers: Testing — runs tests inside workerd runtime
- Biome 2.x: Linting + formatting — replaces ESLint + Prettier, 10-25x faster
- pnpm 10.x: Package manager — strict mode, workspace support, content-addressable store

### Expected Features

The MVP scope is defined by feature parity with the existing system. ~1000 historical events must be migrated from DynamoDB to D1 before launch. Members will expect every feature they currently have. The feature dependency chain is clear: Auth0 authentication must come first, then event CRUD, then participation, then email notifications.

**Must have (table stakes / MVP v1):**
- Auth0 authentication (login/logout/session) — foundation for everything else
- Event CRUD with all 15 event types — core product value, Finnish-language content
- Event participation (join/leave) — the heartbeat of the club, must be instant with optimistic UI
- Event listing (upcoming, chronological) — member-facing landing experience
- Member identity display (participant lists) — social proof drives participation
- Mobile-responsive UI — majority of usage is on phones
- Data migration from DynamoDB to D1 — cannot launch without existing ~1000 events
- New event email notification via AWS SES — members expect to be notified
- Email preferences (opt-in/out) — GDPR requirement for Finnish users

**Should have (competitive / v1.x after migration stable):**
- Weekly Monday email digest — Cloudflare Cron Trigger, meaningful differentiator vs Spond
- External participant access (spinning events) — non-member lightweight accounts, architecturally complex
- PWA add-to-home-screen + offline shell — progressive enhancement after core is solid
- Race event flag — simple boolean, visual indicator for competition vs training
- Service worker offline shell — improves perceived performance

**Defer (v2+):**
- Event type filtering on listing page — only if event volume grows beyond 20/month
- Push notifications — only if email proves insufficient
- Event comments — only if members request coordination features
- Event history/archive view — nice-to-have, not critical

**Explicit anti-features (do not build):**
- Native iOS/Android apps — PWA covers the use case, app store adds maintenance cost
- Real-time updates (WebSockets) — over-engineering for ~100 members and infrequent events
- Payment processing — compliance scope, club handles finances separately
- In-app chat — duplicates existing WhatsApp/Telegram groups

### Architecture Approach

The system uses three independently deployable Cloudflare Workers: the API (Hono), the events PWA (React Router 7), and the static site (Astro). This separation is critical — deploying them as a single Worker creates routing conflicts between the SPA fallback and API routes. The shared `packages/shared` package containing Zod schemas serves double duty as runtime validation in the API and TypeScript type inference in the frontend, eliminating manual API contract maintenance. Auth0 is the canonical identity store; D1 stores only user preferences and participation records keyed by Auth0 `sub`, never duplicating user profile data.

**Major components:**
1. `apps/api` (Cloudflare Worker + Hono) — REST API, JWT validation, event CRUD, email dispatch, cron handlers
2. `apps/events-app` (React Router 7 SPA/PWA) — auth-gated event management, participation UI, PWA manifest
3. `apps/www` (Astro static site) — public club pages, no auth, no runtime dependencies, fully independent
4. `packages/shared` — Zod schemas, event type constants, TypeScript types shared across all apps
5. Cloudflare D1 — events, participants, email preferences tables (accessed only by api worker)
6. Auth0 — identity provider, PKCE flow, JWKS endpoint for JWT verification
7. AWS SES — email delivery via direct HTTP API calls (no SDK, use `aws4fetch`)

**Key patterns:**
- Schema-driven development: Zod schemas in `packages/shared` define API contracts; OpenAPI docs generated from them
- Auth0 JWKS verification: Use `jose`'s `createRemoteJWKSet()` for automatic key caching and rotation handling
- Drizzle repository pattern: Wrap queries in service functions; use `db.batch()` not SQL transactions (D1 does not support `BEGIN`/`COMMIT`)
- Separate Workers for API and SPA: Prevents SPA routing conflicts with API routes

### Critical Pitfalls

1. **DynamoDB-to-D1 schema mismatch** — Re-model from scratch as normalized relational tables; do not port DynamoDB composite keys or single-table patterns. Test migration with real DynamoDB export data. Address in Phase 1 before any application code.

2. **AWS SDK v3 incompatible with Workers** — The `@aws-sdk/client-ses` package imports `node:fs` through `@smithy` and crashes in the Workers runtime. Use `aws4fetch` for SES v2 API requests instead. This failure only manifests in deployed Workers, not in local `wrangler dev`. Address in Phase 2 when building email features.

3. **Auth0 JWKS key rotation causing auth outage** — Caching public keys indefinitely breaks authentication when Auth0 rotates signing keys. Use `jose`'s `createRemoteJWKSet()` which handles caching and rotation automatically. Never hardcode public keys. Address in Phase 2 auth middleware.

4. **Drizzle D1 migrations have no rollback** — Always export the D1 database before applying migrations (`wrangler d1 export`). Keep migrations small and atomic. Use D1 Time Travel as the safety net. Test every migration against a local D1 copy with production data first. Address in Phase 1 as part of migration strategy.

5. **SPA routing conflicts with Cloudflare Workers assets** — The `not_found_handling = "single-page-application"` setting can intercept API requests. Deploy API and frontend as separate Workers with distinct domains (`api.dt65.fi` and `app.dt65.fi`). Decide and validate this architecture in Phase 1 before building either app.

## Implications for Roadmap

Based on the build order dependencies identified in ARCHITECTURE.md and the pitfall prevention phases from PITFALLS.md, a 5-phase structure is recommended:

### Phase 1: Foundation and Infrastructure

**Rationale:** All pitfalls classified as "Phase 1" must be addressed before writing application code. Schema design, migration strategy, deployment architecture, and monorepo toolchain decisions made here cannot be easily changed later without breaking downstream work.

**Delivers:** Working monorepo structure, pnpm workspace configured, CI/CD pipeline with GitHub Actions, D1 database schema designed and migrated from DynamoDB, Cloudflare Workers deployment architecture validated (separate Workers for API, SPA, static site), D1 backup and migration procedures documented and tested.

**Addresses:** Data migration from DynamoDB (MVP requirement), monorepo toolchain setup, deployment architecture decision

**Avoids:**
- DynamoDB-to-D1 schema mismatch (Pitfall 1) — schema designed here, not ported
- Drizzle migration no-rollback trap (Pitfall 4) — backup procedures established here
- SPA routing conflicts (Pitfall 6) — separate Workers architecture confirmed here
- pnpm monorepo build issues in Cloudflare (Pitfall) — CI via GitHub Actions, not Cloudflare Builds

**Key tasks:** pnpm workspace + biome + lefthook + sherif + knip setup, shared tsconfig, `packages/shared` with event type constants and Zod schemas, `apps/api` Drizzle schema + D1 migrations, DynamoDB export + transformation script + D1 import validation, GitHub Actions CI/CD pipeline

### Phase 2: API Core

**Rationale:** The API is the dependency for the frontend. Events-app cannot be developed against a real backend without the API. Auth middleware must be built with key-rotation resilience from the start — retrofitting this is painful. Email is included here because notification hooks are wired to event creation.

**Delivers:** Deployed Hono API on Cloudflare Workers with Auth0 JWT verification, full event CRUD endpoints, participation join/leave, email preferences, new-event email notification via SES, and OpenAPI spec exported for frontend type consumption.

**Addresses:** Auth0 authentication, Event CRUD, Event participation, New event email notification, Email preferences (all MVP P1 features)

**Uses:** Hono + @hono/zod-openapi + Zod v3, Drizzle ORM + D1, `jose` + createRemoteJWKSet, `aws4fetch` for SES, Cloudflare Queues for async email

**Avoids:**
- AWS SDK v3 incompatibility (Pitfall 2) — `aws4fetch` used from day one
- Auth0 JWKS key rotation failure (Pitfall 5) — `jose` `createRemoteJWKSet()` from day one
- D1 single-writer bottleneck (Pitfall 3) — simple participation mutations, proper indexes
- N+1 queries for event listings — JOIN queries with GROUP BY from the start
- Missing `aud` claim validation — auth middleware verified against checklist

### Phase 3: Events Application (Frontend)

**Rationale:** The SPA can be built once a running API exists to develop against. Auth0 PKCE integration, optimistic UI for join/leave, and mobile-responsive layout are the core deliverables. PWA features are progressive enhancements.

**Delivers:** Deployed React Router 7 SPA on Cloudflare Workers with Auth0 PKCE login, event listing, event creation form, event detail with participant list, join/leave with optimistic UI, email preference settings, mobile-responsive Mantine UI, and basic PWA manifest.

**Addresses:** Mobile-responsive UI, Member identity display, PWA add-to-home-screen foundation (MVP + v1.x features)

**Uses:** React Router 7 + @react-router/cloudflare, Mantine 8.x, Auth0 SPA SDK, Hono RPC client (AppType)

**Avoids:**
- iOS Safari safe-area viewport overlap — `env(safe-area-inset-bottom)` applied, tested on physical device
- Finnish character encoding issues — tested with real Finnish event titles
- No optimistic UI for join/leave — React state + mutation pattern from the start
- Form data loss on accidental navigation — `useBlocker` or localStorage persistence

### Phase 4: Static Website

**Rationale:** The Astro static site is fully independent and can be built at any point. It belongs after the PWA because the link from the public site to the events app must point to a working URL. This phase is lower complexity and serves as a buffer before the final polish phase.

**Delivers:** Deployed Astro static site on Cloudflare Workers serving public club information, built with Tailwind CSS 4.x, zero JavaScript runtime, links to events PWA.

**Addresses:** Public web presence (independent from events features)

**Uses:** Astro 5.x + @astrojs/cloudflare, Tailwind CSS 4.x

**Note:** This phase can be parallelized with Phase 3 if there are sufficient developers. Architecture research explicitly notes www has no runtime dependencies on other components.

### Phase 5: Email Digests and PWA Polish

**Rationale:** Scheduled jobs require a working API, a populated D1 database, and validated AWS SES credentials — all of which come from earlier phases. PWA offline shell and service worker updates are progressive enhancements added after core functionality is stable.

**Delivers:** Monday morning weekly email digest (Cloudflare Cron Trigger), service worker offline shell, PWA install prompt with iOS guidance banner, service worker update notification, external participant access for spinning events (scoped Auth0 role).

**Addresses:** Weekly email digest, External participant access, PWA offline shell, Service worker updates (v1.x features)

**Uses:** Cloudflare Cron Triggers, Cloudflare Queues, `aws4fetch` + SES, Auth0 Roles

**Avoids:**
- Cron handler execution time limits — batched email sends, validate within free plan CPU limits
- External participant over-permissioning — scope-based API access control verified against checklist
- Email missing unsubscribe — preferences check + unsubscribe link in every template

### Phase Ordering Rationale

- Foundation first because every pitfall tagged "Phase 1" (schema mismatch, no-rollback migrations, deployment architecture, monorepo builds) is a structural decision that cannot be changed without rework.
- API before frontend because the SPA needs a running API to develop against; the Hono RPC AppType export provides end-to-end type safety only when the API contract is stable.
- Frontend before static site because the static site links to the PWA — the PWA URL must be known and working first.
- Scheduled jobs last because they require a populated production database and validated email credentials from earlier phases.
- The Astro static site (Phase 4) can be parallelized with Phase 3 if team capacity allows, since it has zero runtime dependencies on other components.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (API Core):** External participant auth model (Auth0 roles vs. separate lightweight token system) needs design decision before implementation. The scoped access control pattern is documented but the specific Auth0 configuration for a two-tier membership model (full members vs. external participants) requires tenant-level validation.
- **Phase 5 (Email and PWA):** Cloudflare Cron + SES batch send pattern needs validation against free plan CPU limits (10ms on free tier). If the weekly digest for ~100 members consistently exceeds CPU budget, upgrade to paid plan or restructure as a Queue consumer.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** pnpm workspaces, Biome, Drizzle migrations, and GitHub Actions with Wrangler are all well-documented. The DynamoDB migration is a one-time data transform with clear tooling (DynamoDB Export to S3, then transform + D1 import).
- **Phase 3 (Frontend):** React Router 7 + Mantine + Auth0 SPA SDK is a well-documented stack. Cloudflare deployment guide covers the `@react-router/cloudflare` adapter precisely.
- **Phase 4 (Static Site):** Astro 5 + Cloudflare adapter is mature and documented. No architectural unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All choices validated against official docs and NPM. Version compatibility matrix explicitly documented with open GitHub issues cited for known incompatibilities. |
| Features | HIGH | MVP scope directly mirrors existing system. No speculative features. Competitor analysis (Spond, TeamSnap, Heja) validates the anti-feature decisions. Feature dependency chain is explicit. |
| Architecture | HIGH | Three-Worker deployment pattern is the recommended approach per Cloudflare's own framework guides. Drizzle + D1 patterns confirmed against official Drizzle D1 docs. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls are documented with official sources (Cloudflare D1 limits, Workers limits). Some integration gotchas (aws4fetch, jose JWKS) rely on community guides and GitHub issues rather than official documentation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Auth0 external participant configuration:** The exact Auth0 tenant setup for the two-tier membership model (full members vs. spinning externals) is not documented in official Auth0 docs at the level needed for implementation. Will require hands-on Auth0 console exploration during Phase 2 planning. Options: Auth0 Organizations, custom claims in app metadata, or separate Auth0 Application for externals.
- **SES sending limits on free tier:** The AWS SES sending rate and the Cloudflare Worker CPU budget for the weekly digest need to be validated empirically. At ~100 members, both should be well within limits, but this should be tested with a realistic email template before Phase 5 is planned in detail.
- **D1 Time Travel availability:** The research notes D1 Time Travel provides 7 days on free plan and 30 days on paid. It is unclear whether Time Travel is available in the CF free tier Workers plan or requires a paid D1 plan. Validate this during Phase 1 before defining the backup procedure.

## Sources

### Primary (HIGH confidence)
- [Hono official docs](https://hono.dev/) — framework, RPC, JWT/JWK middleware
- [Cloudflare Workers framework guides](https://developers.cloudflare.com/workers/framework-guides/) — React Router, Hono on Workers
- [Cloudflare Vite plugin docs](https://developers.cloudflare.com/workers/vite-plugin/) — local dev with workerd
- [Drizzle ORM D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1) — ORM patterns, migration workflow
- [Cloudflare D1 docs](https://developers.cloudflare.com/d1/) — limits, Time Travel, foreign keys
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — scheduled handler limits
- [Cloudflare Queues](https://developers.cloudflare.com/queues/) — async email processing
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — static site deployment
- [Mantine React Router guide](https://mantine.dev/guides/react-router/) — UI library integration
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first configuration
- [pnpm workspaces](https://pnpm.io/workspaces) — monorepo management
- [aws4fetch for Workers](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/) — SES without AWS SDK
- [Auth0 SPA SDK PKCE](https://github.com/auth0/auth0-spa-js) — PKCE flow for events PWA
- [Biome roadmap 2026](https://biomejs.dev/blog/roadmap-2026/) — v2.3 current stable
- [Lefthook GitHub](https://github.com/evilmartians/lefthook) — git hooks manager

### Secondary (MEDIUM confidence)
- [Zod v4 support issue #1177](https://github.com/honojs/middleware/issues/1177) — confirms Zod v3 pin required
- [Vitest 4 pool support issue #11064](https://github.com/cloudflare/workers-sdk/issues/11064) — confirms Vitest 3.x pin required
- [SPA routing conflict issue #8879](https://github.com/cloudflare/workers-sdk/issues/8879) — confirms separate Workers deployment
- [Drizzle ORM migration rollback discussion #1339](https://github.com/drizzle-team/drizzle-orm/discussions/1339) — no down migrations
- [AWS SDK v3 Workers issue #6284](https://github.com/aws/aws-sdk-js-v3/discussions/6284) — node:fs failure in Workers
- [pnpm monorepo Workers SDK issue #10941](https://github.com/cloudflare/workers-sdk/issues/10941) — workspace build isolation
- [SES Emails from Workers](https://www.ai.moda/en/blog/ses-emails-from-workers) — aws4fetch SES integration pattern
- [JWT Validation at Edge](https://securityboulevard.com/2025/11/how-to-validate-jwts-efficiently-at-the-edge-with-cloudflare-workers-and-vercel/) — jose JWKS caching

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
