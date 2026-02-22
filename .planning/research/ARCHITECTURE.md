# Architecture Research

**Domain:** Sports club event management ecosystem (DT65)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                    │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐     │
│  │  www (Astro)      │  │  events-app (React Router 7 + Mantine)  │     │
│  │  Static site      │  │  SPA / PWA                              │     │
│  │  Club info pages  │  │  Event CRUD, participation, auth        │     │
│  └──────────────────┘  └─────────────────┬────────────────────────┘     │
│                                          │ HTTPS (JWT Bearer)           │
├──────────────────────────────────────────┼──────────────────────────────┤
│                         Auth Layer       │                              │
│  ┌───────────────────────────────────────┼─────────────────────────┐    │
│  │  Auth0 (External)                     │                         │    │
│  │  - PKCE flow for SPA                  │                         │    │
│  │  - JWT issuance                       │                         │    │
│  │  - User management                   │                         │    │
│  │  - JWKS endpoint for verification    │                         │    │
│  └───────────────────────────────────────┼─────────────────────────┘    │
│                                          │                              │
├──────────────────────────────────────────┼──────────────────────────────┤
│                         API Layer        │                              │
│  ┌───────────────────────────────────────┴─────────────────────────┐    │
│  │  api (Cloudflare Worker)                                        │    │
│  │  Hono + Zod OpenAPI + Drizzle                                   │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │    │
│  │  │ Events     │ │ Auth       │ │ Users      │ │ Scheduled   │  │    │
│  │  │ Routes     │ │ Middleware │ │ Routes     │ │ Handlers    │  │    │
│  │  └─────┬──────┘ └────────────┘ └─────┬──────┘ └──────┬──────┘  │    │
│  │        │                             │               │          │    │
│  └────────┼─────────────────────────────┼───────────────┼──────────┘    │
│           │                             │               │               │
├───────────┼─────────────────────────────┼───────────────┼───────────────┤
│           │     Data & Services Layer   │               │               │
│  ┌────────┴─────────────────────────────┴──────┐  ┌─────┴────────┐     │
│  │  Cloudflare D1 (SQLite)                      │  │  AWS SES     │     │
│  │  - events table                              │  │  Email       │     │
│  │  - participants table                        │  │  delivery    │     │
│  │  - preferences table                         │  └──────────────┘     │
│  └──────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **www** (Astro static site) | Club information pages, public-facing content. No auth required. Pre-rendered HTML + CSS with zero JS runtime. | Deployed independently to Cloudflare. No runtime dependencies. |
| **events-app** (React Router 7 SPA) | Event CRUD, participation join/leave, member profiles, email preferences. Auth-gated PWA. | Auth0 (PKCE login flow), API Worker (REST via JWT Bearer tokens) |
| **api** (Cloudflare Worker + Hono) | REST API serving events-app. Event CRUD, participation management, user preferences, email dispatch. JWT validation. | D1 database (Drizzle ORM), Auth0 JWKS (token verification), AWS SES (email sending) |
| **Auth0** (external service) | Identity provider. User registration, login, JWT issuance, user metadata storage. PKCE flow for SPA. | events-app (redirect-based login), API (JWKS verification endpoint) |
| **Cloudflare D1** (database) | Persistent storage for events, participation records, email preferences. SQLite-based. | API Worker only (Drizzle ORM queries via Worker binding) |
| **AWS SES** (external service) | Email delivery for weekly digests and new-event notifications. | API Worker (HTTP API calls from scheduled handlers) |

## Recommended Project Structure

```
downtown65-ecosystem/
├── apps/
│   ├── api/                    # Cloudflare Worker (Hono API)
│   │   ├── src/
│   │   │   ├── routes/         # Hono route handlers
│   │   │   │   ├── events.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── health.ts
│   │   │   ├── middleware/      # Auth, CORS, error handling
│   │   │   │   ├── auth.ts     # JWT verification via Auth0 JWKS
│   │   │   │   └── error.ts
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── events.ts
│   │   │   │   ├── participants.ts
│   │   │   │   └── email.ts    # AWS SES integration
│   │   │   ├── db/
│   │   │   │   ├── schema.ts   # Drizzle table definitions
│   │   │   │   └── migrations/ # D1 SQL migrations
│   │   │   ├── scheduled/      # Cron trigger handlers
│   │   │   │   └── weekly-digest.ts
│   │   │   └── index.ts        # Hono app entry point
│   │   ├── wrangler.jsonc      # Worker config + D1 binding + cron triggers
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── events-app/             # React Router 7 SPA/PWA
│   │   ├── src/
│   │   │   ├── routes/         # File-based routes (React Router 7)
│   │   │   ├── components/     # Shared UI components (Mantine)
│   │   │   ├── hooks/          # Custom hooks (auth, data fetching)
│   │   │   ├── api/            # API client (typed from OpenAPI)
│   │   │   ├── auth/           # Auth0 provider + guards
│   │   │   └── entry.client.tsx
│   │   ├── public/
│   │   │   └── manifest.json   # PWA manifest
│   │   ├── wrangler.jsonc      # Worker config for static assets
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── www/                    # Astro static site
│       ├── src/
│       │   ├── pages/          # Astro pages
│       │   ├── layouts/        # Page layouts
│       │   └── components/     # Astro components (Tailwind)
│       ├── wrangler.jsonc      # Worker config for static assets
│       ├── astro.config.mjs
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                 # Shared types, constants, utilities
│   │   ├── src/
│   │   │   ├── types/          # Event types, user types, API contracts
│   │   │   │   ├── events.ts   # Event, EventType, Participant
│   │   │   │   └── users.ts    # User, Preferences
│   │   │   ├── constants/      # 15 event types, validation rules
│   │   │   └── schemas/        # Zod schemas (shared validation)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/          # Shared Biome/lint configuration
│   └── tsconfig/               # Shared TypeScript configurations
│
├── pnpm-workspace.yaml         # Workspace definition
├── package.json                # Root scripts, devDependencies
├── biome.json                  # Biome configuration
├── lefthook.yml                # Git hooks
└── CLAUDE.md                   # Development conventions
```

### Structure Rationale

- **apps/ vs packages/:** Clear separation between deployable units (apps/) and shared libraries (packages/). Each app in apps/ has its own wrangler.jsonc and deploys independently to Cloudflare.
- **packages/shared/:** The Zod schemas defined here serve double duty: runtime validation in the API and type inference in the events-app. This is the primary mechanism for keeping API contracts in sync across the monorepo.
- **routes/ in API:** Hono routes map directly to REST resource endpoints. Each file exports a Hono sub-app that gets mounted in index.ts.
- **services/ in API:** Business logic separated from route handlers. Routes handle HTTP concerns (parsing, responses); services handle domain logic (event creation rules, participation checks).
- **No Turborepo:** For a 3-app monorepo with ~100-member user base, pnpm workspace scripts are sufficient. Turborepo adds complexity without proportional benefit at this scale.

## Architectural Patterns

### Pattern 1: Zod-First API Design (Schema-Driven Development)

**What:** Define Zod schemas first, derive TypeScript types, OpenAPI docs, and validation from them.
**When to use:** Every API endpoint. This is the backbone pattern for the entire API.
**Trade-offs:** Slightly more boilerplate per endpoint, but eliminates type drift between API and client.

**Example:**
```typescript
// packages/shared/src/schemas/events.ts
import { z } from 'zod';

export const EventTypeEnum = z.enum([
  'cycling', 'running', 'skiing', 'swimming', 'triathlon',
  'orienteering', 'skating', 'spinning', 'trackAndField',
  'trail', 'ultramarathon', 'walking', 'nordicWalking',
  'other', 'multisport'
]);

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  type: EventTypeEnum,
  date: z.string().datetime(),
  location: z.string().max(200),
  description: z.string().max(2000).optional(),
  race: z.boolean().default(false),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;

// apps/api/src/routes/events.ts
import { createRoute } from '@hono/zod-openapi';
import { CreateEventSchema } from '@dt65/shared';

const createEventRoute = createRoute({
  method: 'post',
  path: '/events',
  request: { body: { content: { 'application/json': { schema: CreateEventSchema } } } },
  responses: { 201: { description: 'Event created' } },
});
```

### Pattern 2: Auth0 JWT Middleware with JWKS Verification

**What:** Hono middleware that validates Auth0 JWTs on every protected request using the Auth0 JWKS endpoint. No shared secrets needed.
**When to use:** All API routes except health check and public endpoints.
**Trade-offs:** First request per cold start requires JWKS fetch. Cache JWKS keys to avoid repeated lookups.

**Example:**
```typescript
// apps/api/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { jwt } from '@cfworker/jwt';

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authorization.slice(7);
  const result = await jwt.verify(token, {
    issuer: c.env.AUTH0_ISSUER,
    audience: c.env.AUTH0_AUDIENCE,
  });
  if (!result.valid) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  c.set('userId', result.payload.sub);
  await next();
});
```

### Pattern 3: Drizzle Repository Pattern for D1

**What:** Wrap Drizzle queries in service functions that handle D1 constraints (batch operations instead of transactions, integer timestamps).
**When to use:** All database access in the API.
**Trade-offs:** Extra abstraction layer, but isolates D1-specific patterns (no BEGIN/COMMIT, batch() for multi-statement operations).

**Example:**
```typescript
// apps/api/src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),        // ULID or UUID
  creatorId: text('creator_id').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(),       // EventType enum stored as text
  dateStart: integer('date_start', { mode: 'timestamp' }).notNull(),
  location: text('location'),
  description: text('description'),
  race: integer('race', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id),
  userId: text('user_id').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
});

// apps/api/src/services/events.ts
export async function createEvent(db: DrizzleD1Database, data: CreateEvent, userId: string) {
  const id = generateId();
  const now = new Date();
  await db.insert(events).values({
    id,
    creatorId: userId,
    ...data,
    dateStart: new Date(data.date),
    createdAt: now,
    updatedAt: now,
  });
  return id;
}
```

## Data Flow

### Request Flow: Create Event

```
[Member in events-app]
    │
    │ 1. User fills event form (Mantine components)
    ↓
[Auth0 SDK] ─── getAccessTokenSilently() ──→ [Auth0]
    │                                            │
    │ 2. JWT access token                        │ (cached, refreshed via PKCE)
    ↓                                            ↓
[API Client] ─── POST /api/events ──→ [Cloudflare Worker]
    │              (Bearer JWT)              │
    │                                        │ 3. Auth middleware validates JWT
    │                                        │    against Auth0 JWKS endpoint
    │                                        ↓
    │                                   [Hono Route Handler]
    │                                        │
    │                                        │ 4. Zod validates request body
    │                                        ↓
    │                                   [Event Service]
    │                                        │
    │                                        │ 5. Drizzle inserts into D1
    │                                        ↓
    │                                   [Cloudflare D1]
    │                                        │
    │ 6. 201 Created + event data            │
    ↓                                        ↓
[events-app updates UI]             [Optional: trigger new-event email]
```

### Request Flow: Join Event

```
[Member in events-app]
    │
    │ POST /api/events/:id/participants
    ↓
[API Worker]
    │
    │ 1. Validate JWT, extract userId
    │ 2. Check event exists
    │ 3. Check user not already joined
    │ 4. Insert participant record
    │ 5. Return updated participant list
    ↓
[Cloudflare D1]
```

### Scheduled Flow: Weekly Email Digest

```
[Cloudflare Cron Trigger] ─── Monday 06:00 UTC (08:00 Helsinki) ───→ [API Worker scheduled() handler]
    │
    │ 1. Query D1 for events in next 7 days
    │ 2. Query D1 for users with digest preference enabled
    │ 3. Format email content per user
    │ 4. Send via AWS SES API
    ↓
[AWS SES] ──→ [Member email inbox]
```

### Auth Flow: Login

```
[Member opens events-app]
    │
    │ 1. Auth0Provider checks session
    ↓
[No session] ──→ Auth0 Universal Login (redirect)
    │                     │
    │                     │ 2. User authenticates (email/password)
    │                     ↓
    │              Auth0 issues authorization code
    │                     │
    │                     │ 3. PKCE exchange (code → tokens)
    │                     ↓
    │              events-app receives JWT access token + ID token
    │
    │ 4. All subsequent API calls include Bearer token
    ↓
[API Worker validates JWT against Auth0 JWKS on each request]
```

### Key Data Flows

1. **Event lifecycle:** Create (member) -> Read (all members) -> Update (creator only) -> Delete (creator only). Participation is additive: members join/leave without modifying the event itself.
2. **Auth token flow:** Auth0 issues JWTs to events-app via PKCE. events-app attaches tokens to API requests. API verifies tokens against Auth0 JWKS. No tokens stored server-side.
3. **Email notifications:** Triggered by cron (weekly digest) or event creation (new-event alert). API queries D1 for recipients and preferences, then calls AWS SES HTTP API directly from the Worker.
4. **External participants:** Lightweight accounts in Auth0 with limited permissions. Same auth flow but restricted to specific event types (spinning). API enforces access control based on Auth0 roles/metadata.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| ~100 members (current) | Single D1 database, single API Worker, no caching needed. D1 free tier (500 MB) is more than sufficient for ~1000 events. |
| ~1,000 members | Still fine with single D1. May want to add Cloudflare KV for caching event lists to reduce D1 read load. Consider rate limiting on the API Worker. |
| ~10,000+ members | Unlikely for a sports club. If needed: D1 read replicas (built-in), Worker caching with Cache API, possibly split API into multiple Workers with service bindings. |

### Scaling Priorities

1. **First bottleneck:** D1 write throughput during high-activity periods (event creation before a race week). Mitigation: D1 handles this fine at ~100 members. Single-threaded writes are only a concern at thousands of concurrent writes.
2. **Second bottleneck:** Email sending volume for notifications. Mitigation: AWS SES handles this at any realistic club size. Batch emails in scheduled handler.

## Anti-Patterns

### Anti-Pattern 1: Full-Stack Worker (API + SPA in One Worker)

**What people do:** Bundle the React SPA and API into a single Cloudflare Worker to avoid CORS and simplify deployment.
**Why it's wrong:** Couples deployment lifecycles. A UI typo fix requires redeploying the entire API. Different build toolchains (Vite for SPA, Wrangler for Worker) conflict. Testing becomes harder.
**Do this instead:** Separate Workers for API and events-app. Use CORS middleware on the API. Deploy independently. The events-app is a static SPA served by Cloudflare Workers static assets; the API is a pure Hono Worker.

### Anti-Pattern 2: Storing Auth State in D1

**What people do:** Duplicate Auth0 user data into D1, creating a local users table that mirrors Auth0.
**Why it's wrong:** Creates sync problems. Auth0 is the source of truth for user identity. Two sources of user data means stale data, conflict resolution, and migration headaches.
**Do this instead:** Use Auth0 as the canonical user store. Store only user preferences (email opt-in/out) and participation records in D1, keyed by Auth0 `sub` (user ID). Fetch user profile data from Auth0 Management API only when needed (and cache it).

### Anti-Pattern 3: SQL Transactions in D1

**What people do:** Use `BEGIN TRANSACTION` / `COMMIT` for multi-statement operations.
**Why it's wrong:** D1 does not support SQL transactions. A single write transaction blocks the entire database.
**Do this instead:** Use `db.batch()` in Drizzle for atomic multi-statement operations. D1 batches execute as a single transaction internally. Design schemas to minimize the need for cross-table atomic writes.

### Anti-Pattern 4: Storing Dates as Text in D1

**What people do:** Store ISO date strings in D1 text columns.
**Why it's wrong:** SQLite (and D1) has no native date type. Text dates cannot be efficiently compared or sorted by the database engine.
**Do this instead:** Use `integer` columns with `{ mode: 'timestamp' }` in Drizzle. Stores Unix timestamps as integers, enabling efficient range queries (`WHERE date_start > ?`) and sorting.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Auth0** | PKCE flow (SPA), JWKS verification (API), Management API (user metadata) | Free tier covers ~100 members. Configure `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE` as environment variables. |
| **AWS SES** | HTTP API calls from Worker scheduled handlers | Requires AWS access keys stored as Worker secrets. Region-specific endpoint (eu-west-1 for Finland). Only AWS component retained. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **events-app <-> api** | HTTPS REST (JSON), JWT Bearer auth | CORS configured on API Worker. API URL as environment variable in events-app build. |
| **api <-> D1** | Drizzle ORM via Worker D1 binding | Binding configured in wrangler.jsonc. No network hop -- D1 is accessed via Worker runtime binding. |
| **www <-> (nothing)** | No runtime dependencies | Pure static site. No API calls. Deployed independently. Could link to events-app for login. |
| **api scheduled <-> api routes** | Same Worker, different entry points | `fetch()` handler for HTTP, `scheduled()` handler for cron. Share the same Drizzle instance and services. |

## Build Order (Dependency Chain)

The components have clear dependency ordering that dictates build sequence:

```
Phase 1: Foundation
  ├── packages/shared          (types, schemas, constants -- no dependencies)
  ├── packages/tsconfig        (shared TS config -- no dependencies)
  └── packages/eslint-config   (shared lint config -- no dependencies)

Phase 2: Data Layer
  └── apps/api (schema + migrations only)
      ├── depends on: packages/shared (Zod schemas, event types)
      └── output: D1 database schema, Drizzle config, migration files

Phase 3: API Core
  └── apps/api (routes + middleware + services)
      ├── depends on: packages/shared, D1 schema (Phase 2)
      ├── includes: Auth middleware, event CRUD routes, participation routes
      └── output: Deployable Hono Worker with OpenAPI spec

Phase 4: Events Application
  └── apps/events-app
      ├── depends on: packages/shared (types), apps/api (running API)
      ├── includes: Auth0 integration, event UI, participation UI
      └── output: Deployable React Router 7 SPA/PWA

Phase 5: Static Website
  └── apps/www
      ├── depends on: nothing (fully independent)
      ├── can be built in parallel with any phase
      └── output: Deployable Astro static site

Phase 6: Email & Scheduled Jobs
  └── apps/api (scheduled handlers)
      ├── depends on: API core (Phase 3), AWS SES credentials
      ├── includes: Weekly digest cron, new-event notification
      └── output: Extended API Worker with cron triggers
```

**Build order rationale:**
- **shared first** because both api and events-app import types and schemas from it
- **API schema before routes** because Drizzle migrations must be tested against D1 before building business logic
- **API before events-app** because the SPA needs a running API to develop against (can use mock data initially, but integration testing requires the API)
- **www is independent** and can be built at any time without blocking or being blocked by other components
- **Scheduled jobs last** because they require a working API, a populated D1 database, and AWS SES credentials -- all of which come from earlier phases

## Sources

- [Hono Cloudflare Workers Getting Started](https://hono.dev/docs/getting-started/cloudflare-workers) -- HIGH confidence
- [Cloudflare Workers Framework Guides: Hono](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/) -- HIGH confidence
- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) -- HIGH confidence
- [Drizzle ORM Cloudflare D1 Connection Guide](https://orm.drizzle.team/docs/connect-cloudflare-d1) -- HIGH confidence
- [Hono Zod OpenAPI Middleware](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) -- HIGH confidence
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) -- HIGH confidence
- [Auth0 SPA SDK (PKCE)](https://github.com/auth0/auth0-spa-js) -- HIGH confidence
- [Cloudflare Workers Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) -- HIGH confidence
- [React Router 7 Cloudflare Workers Deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/) -- HIGH confidence
- [Astro Cloudflare Deployment](https://docs.astro.build/en/guides/deploy/cloudflare/) -- HIGH confidence
- [Cloudflare Monorepo Advanced Setups](https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/) -- HIGH confidence
- [Cloudflare Full-Stack Development Blog Post](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/) -- MEDIUM confidence

---
*Architecture research for: DT65 sports club event management ecosystem*
*Researched: 2026-02-22*
