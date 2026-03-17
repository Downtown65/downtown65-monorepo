# Phase 4: API - Research

**Researched:** 2026-03-17
**Domain:** Hono API on Cloudflare Workers with Auth0 JWT, Zod OpenAPI, Drizzle D1
**Confidence:** HIGH

## Summary

Phase 4 builds the API layer on top of the existing Hono app skeleton and Drizzle/D1 database from Phase 3. The existing `apps/api` already has Hono 4.7.5, Drizzle ORM 0.45.1, D1 bindings, VarLock env management, and a Vitest config with `@cloudflare/vitest-pool-workers`. The main work is: (1) adding `@hono/zod-openapi` for type-safe OpenAPI routes with Zod v4, (2) adding Hono's built-in `jwk` middleware for Auth0 JWT validation, (3) implementing event CRUD and participation endpoints, (4) adding `@scalar/hono-api-reference` for API docs, and (5) building a test suite.

A critical finding: the `usersToEvents` join table currently lacks a `joined_at` column, but the user's CONTEXT decisions require participant lists to include a join timestamp showing sign-up order. A schema migration will be needed.

**Primary recommendation:** Use `@hono/zod-openapi` with Zod v4 (issue #1177 resolved August 2025, stable support confirmed), Hono's built-in `jwk` middleware for Auth0 JWKS validation, and `@scalar/hono-api-reference` for API documentation. Organize routes in feature-based folders following the index/routes/handlers pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- RESTful URL structure: `/api/events`, `/api/events/:id`, `/api/events/:id/participants`
- Direct payload responses -- success returns the resource directly, errors use HTTP status + `{ error: { code, message } }`
- Event list returns summaries (title, date, type, participant count); detail endpoint returns full event
- OpenAPI spec via Zod OpenAPI; Scalar for interactive API documentation
- All API requests require `x-api-key` header (stored as env variable via VarLock, no rotation needed)
- Auth0 JWT required on all endpoints except individual event detail (public for WhatsApp OG sharing)
- Member identity from JWT `sub` claim (Auth0 user ID like `auth0|abc123`)
- Event ownership tracked via `createdBy` field in DB, compared against JWT `sub` for edit/delete
- Unauthorized edit/delete returns 403 Forbidden with message
- 15 event types: CYCLING, KARONKKA, MEETING, NORDIC_WALKING, ICE_HOCKEY, ORIENTEERING, OTHER, RUNNING, SKIING, SPINNING, SWIMMING, TRACK_RUNNING, TRAIL_RUNNING, TRIATHLON, ULTRAS
- Race flag is a boolean -- indicates competition vs. casual training
- Required fields: type, title, dateStart
- Optional fields: time, location, subtitle, description, race (defaults to false)
- Strict Zod validation with field-level error messages (400 status)
- Join is idempotent -- re-joining returns 200 silently, no duplicate entry
- Leave is idempotent -- leaving an event you're not in returns 200 silently
- Members can only join/leave upcoming events (dateStart in the future), 400 for past events
- Participant nicknames come from local members table in D1 (not Auth0)
- Participant list includes nickname + join timestamp (shows sign-up order)
- Individual event endpoint must be public (no JWT) so WhatsApp OG metadata is visible
- Event types already defined in shared package as `EVENT_TYPES` const array
- Use Zod OpenAPI for schema definitions that serve both validation and OpenAPI spec generation

### Claude's Discretion
- Pagination approach (cursor-based vs offset vs no pagination)
- Exact error response structure details
- Middleware ordering and composition
- Test structure and coverage strategy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-05 | Vitest unit/integration tests, Playwright E2E tests | Vitest config already exists with `@cloudflare/vitest-pool-workers`; D1 migration helpers available via `cloudflare:test` module; `app.request()` pattern for integration testing |
| INFR-07 | API on Cloudflare Workers (Hono + Zod OpenAPI + Drizzle D1) | Hono 4.7.5 already in place; `@hono/zod-openapi` 1.2.1 in catalog supports Zod v4; Drizzle schema exists; `@scalar/hono-api-reference` for docs |
| EVNT-01 | Member can create event with type, date, time, location, title, subtitle, description, race flag | POST `/api/events` with Zod validation schema; 15 event types validated; Drizzle insert to events table |
| EVNT-02 | Member can edit their own events | PUT/PATCH `/api/events/:id` with ownership check (creatorId === JWT sub); 403 on mismatch |
| EVNT-03 | Member can delete their own events | DELETE `/api/events/:id` with ownership check; cascade delete handles participants |
| EVNT-04 | Member can join an event | POST `/api/events/:id/participants` with idempotent upsert; date check for past events |
| EVNT-05 | Member can leave an event | DELETE `/api/events/:id/participants` with idempotent delete; date check for past events |
| EVNT-06 | Member can view chronological list of upcoming events | GET `/api/events` with dateStart >= today filter, ordered by dateStart ASC; summary response |
| EVNT-07 | Member can view event details with participant list | GET `/api/events/:id` (public endpoint); join query for participants with nicknames |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| hono | 4.7.5 | HTTP framework | Already installed; runs natively on CF Workers |
| @hono/zod-openapi | 1.2.1 (catalog) | OpenAPI route definitions + Zod validation | Zod v4 support resolved (issue #1177 closed Aug 2025); serves both validation and docs |
| drizzle-orm | 0.45.1 | D1 database ORM | Already installed; schema already defined in Phase 3 |
| zod | 4.3.5 (catalog) | Schema validation | Already in catalog; Zod v4 supported by @hono/zod-openapi |
| @scalar/hono-api-reference | latest | Interactive API documentation UI | Official Hono integration; user decision for Scalar |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cloudflare/vitest-pool-workers | 0.12.1 (catalog) | Workers runtime test pool | Already configured; integration tests run in actual Workers runtime |
| vitest | 3.2.0 (catalog) | Test framework | Already configured; compatible with CF pool workers |
| varlock | 0.4.0 | Env variable management | Already installed; provides X_API_KEY and other secrets |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hono built-in `jwk` middleware | jose library | `jwk` is built into Hono, handles Auth0 JWKS natively, validates RS256; jose adds a dependency for no benefit |
| @scalar/hono-api-reference | @hono/swagger-ui | Scalar has modern UI, better DX; user explicitly chose Scalar |
| No pagination | Cursor-based pagination | ~20 events/month for ~100 members; no pagination needed initially (recommendation at Claude's discretion) |

**Installation:**
```bash
pnpm --filter @dt65/api add @hono/zod-openapi @scalar/hono-api-reference
```

Note: `@hono/zod-openapi` and `@scalar/hono-api-reference` should be added to the pnpm catalog in `pnpm-workspace.yaml` first.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── index.ts                    # App entry point, middleware composition, route mounting
├── app.ts                      # OpenAPIHono app creation and global config
├── db/
│   └── schema.ts               # Drizzle schema (existing)
├── middleware/
│   ├── api-key.ts              # x-api-key header validation middleware
│   ├── auth.ts                 # Auth0 JWT middleware (jwk)
│   └── error-handler.ts       # Global error/not-found handlers
├── routes/
│   └── events/
│       ├── events.index.ts     # Router creation + route mounting
│       ├── events.routes.ts    # OpenAPI route definitions (createRoute)
│       ├── events.handlers.ts  # Handler implementations
│       └── events.schemas.ts   # Zod schemas for request/response
├── services/
│   ├── event-service.ts        # Event CRUD business logic (Drizzle queries)
│   └── participant-service.ts  # Participation business logic
└── __tests__/
    ├── setup.ts                # D1 migration application
    ├── events.test.ts          # Event CRUD integration tests
    └── participants.test.ts    # Participation integration tests
```

### Pattern 1: OpenAPIHono Route Definition
**What:** Define routes with Zod schemas that generate both validation and OpenAPI spec
**When to use:** Every API endpoint
**Example:**
```typescript
// Source: https://hono.dev/examples/zod-openapi
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const createEventRoute = createRoute({
  method: 'post',
  path: '/api/events',
  request: {
    body: {
      content: { 'application/json': { schema: CreateEventSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: EventSchema } },
      description: 'Event created',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Validation error',
    },
  },
});
```

### Pattern 2: Hono JWK Middleware for Auth0
**What:** Built-in middleware that validates JWTs against Auth0 JWKS endpoint
**When to use:** All protected endpoints (everything except GET `/api/events/:id`)
**Example:**
```typescript
// Source: https://hono.dev/docs/middleware/builtin/jwk
import { jwk } from 'hono/jwk';

app.use(
  '/api/*',
  jwk({
    jwks_uri: (c) => `https://${c.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    alg: ['RS256'],
    verification: {
      iss: (c) => `https://${c.env.AUTH0_DOMAIN}/`,
      aud: (c) => c.env.AUTH0_AUDIENCE,
    },
  })
);

// Access JWT payload in handlers
app.get('/api/me', (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub; // "auth0|abc123"
});
```

### Pattern 3: Integration Testing with D1
**What:** Tests run in Workers runtime with real D1 bindings using migration helpers
**When to use:** All database-dependent tests
**Example:**
```typescript
// Source: https://hono.dev/examples/cloudflare-vitest
import { env } from 'cloudflare:test';
import { applyD1Migrations } from 'cloudflare:test';
import app from '../src/index';

// In setup file: apply migrations
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// In test file: use app.request with env
const res = await app.request('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Test', type: 'RUNNING', dateStart: '2026-04-01' }),
}, env);

expect(res.status).toBe(201);
```

### Pattern 4: Selective Auth Middleware (Public Event Detail)
**What:** Apply JWT auth to all routes except specific public endpoints
**When to use:** GET `/api/events/:id` must be public for WhatsApp OG sharing
**Example:**
```typescript
// Option A: Use allow_anon on the detail route
const publicEventRoute = createRoute({
  method: 'get',
  path: '/api/events/{id}',
  middleware: [jwk({ ...config, allow_anon: true })],
  // ...
});

// Option B: Mount protected and public routes on separate sub-apps
const protectedApp = new OpenAPIHono();
protectedApp.use('*', jwk({ ...config }));

const publicApp = new OpenAPIHono();
// No auth middleware on public app

app.route('/api', protectedApp);
app.route('/api', publicApp);
```

### Anti-Patterns to Avoid
- **Mixing Zod schemas between validation and OpenAPI:** Use `@hono/zod-openapi`'s `z` import (re-exported from zod-openapi) for schemas that need `.openapi()` metadata. Do not import `z` from `zod` directly for route schemas.
- **Hand-rolling JWT verification:** Hono's `jwk` middleware handles JWKS fetching, key matching by `kid`, signature verification, and claim validation. Do not use `jose` or manual `crypto.subtle` calls.
- **Blocking on JWKS fetch per request:** Hono's `jwk` middleware caches JWKS responses. If additional caching is needed on CF Workers, pass `{ cf: { cacheEverything: true, cacheTtl: 3600 } }` as second arg.
- **Throwing errors for business logic:** Use HTTP status codes and the `{ error: { code, message } }` response structure. Reserve `throw` for `HTTPException` in middleware only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification with JWKS | Manual `crypto.subtle.verify` + JWKS fetch | `hono/jwk` middleware | Handles kid matching, key rotation, algorithm verification, claim validation |
| API key validation | Manual header extraction + comparison | Custom middleware with `timingSafeEqual` | Prevent timing attacks; simple but must be constant-time |
| OpenAPI spec generation | Manual JSON construction | `@hono/zod-openapi` | Auto-generates from route definitions; stays in sync with validation |
| Request validation | Manual field checking | Zod schemas via `@hono/zod-openapi` | Type-safe, field-level errors, OpenAPI integration |
| ID generation | Manual UUID/timestamp IDs | `crypto.randomUUID()` or ULID library | Existing events use ULIDs; new events should use consistent format |
| Date comparison for past events | Manual string comparison | ISO date string comparison (YYYY-MM-DD format) | ISO dates sort lexicographically; safe for `>=` comparison |

**Key insight:** The Hono + Zod OpenAPI stack provides end-to-end type safety from request validation through handler typing to OpenAPI documentation. Hand-rolling any part of this chain breaks the type safety guarantee.

## Common Pitfalls

### Pitfall 1: Missing `joined_at` Column in Schema
**What goes wrong:** The `usersToEvents` join table currently has only `userId` and `eventId` columns. The CONTEXT requires participant lists to include a join timestamp showing sign-up order.
**Why it happens:** Phase 3 schema was designed before the Phase 4 participation requirements were finalized.
**How to avoid:** Generate a new Drizzle migration adding a `joined_at TEXT NOT NULL` column to `usersToEvents` before implementing participation endpoints. Use `DEFAULT (datetime('now'))` or set it in the application layer.
**Warning signs:** Participant lists have no ordering, or ordering is arbitrary.

### Pitfall 2: Zod v4 Import Path for OpenAPI Schemas
**What goes wrong:** Importing `z` from `zod` directly instead of from `@hono/zod-openapi` means `.openapi()` method is unavailable on schemas.
**Why it happens:** Muscle memory from using Zod standalone.
**How to avoid:** Always use `import { z } from '@hono/zod-openapi'` for schemas used in route definitions.
**Warning signs:** TypeScript error: "Property 'openapi' does not exist on type..."

### Pitfall 3: Auth Middleware on Public Event Detail Endpoint
**What goes wrong:** Applying blanket JWT auth to `/api/*` blocks the public event detail endpoint needed for WhatsApp OG sharing.
**Why it happens:** Global middleware applied too broadly.
**How to avoid:** Use route-level middleware composition or `allow_anon: true` for the specific endpoint. Structure middleware so the x-api-key check applies globally but JWT auth is selective.
**Warning signs:** WhatsApp link previews show errors instead of event details.

### Pitfall 4: D1 Boolean Handling
**What goes wrong:** SQLite/D1 stores booleans as integers (0/1). Zod schema expects boolean type. Responses leak 0/1 instead of true/false.
**Why it happens:** Drizzle returns raw integer values for `integer` columns.
**How to avoid:** Use Drizzle's `.mapWith()` or transform in the service layer to convert 0/1 to boolean. Alternatively, use `{ mode: 'boolean' }` in the Drizzle schema column definition.
**Warning signs:** API responses contain `"race": 0` instead of `"race": false`.

### Pitfall 5: VarLock + Vitest Integration
**What goes wrong:** Tests fail because VarLock tries to resolve secrets from Infisical during test runs.
**Why it happens:** VarLock is designed for runtime env management; tests use `cloudflare:test` env instead.
**How to avoid:** In tests, pass `env` from `cloudflare:test` directly to `app.request()`. Mock or bypass VarLock in test context. The test wrangler config should define `X_API_KEY` and `AUTH0_DOMAIN` as test vars.
**Warning signs:** Tests hang waiting for Infisical connection, or fail with credential errors.

### Pitfall 6: OpenAPIHono vs Hono Type Mismatch
**What goes wrong:** Using `new Hono()` instead of `new OpenAPIHono()` means `app.openapi()` method is unavailable.
**Why it happens:** Phase 3 skeleton uses `new Hono()` in `src/index.ts`.
**How to avoid:** Replace `Hono` with `OpenAPIHono` from `@hono/zod-openapi` in the app entry point.
**Warning signs:** TypeScript error: "Property 'openapi' does not exist..."

## Code Examples

### OpenAPIHono App Setup with Middleware
```typescript
// Source: https://hono.dev/examples/zod-openapi + https://hono.dev/docs/middleware/builtin/jwk
import { OpenAPIHono } from '@hono/zod-openapi';
import { jwk } from 'hono/jwk';
import { cors } from 'hono/cors';
import { Scalar } from '@scalar/hono-api-reference';

type Bindings = {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  X_API_KEY: string;
};

type Variables = {
  jwtPayload: { sub: string; [key: string]: unknown };
};

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware stack
app.use('/api/*', cors());
app.use('/api/*', apiKeyMiddleware());

// JWT on all /api/* routes except public event detail
// Handled per-route or with allow_anon

// OpenAPI doc + Scalar UI
app.doc31('/doc', {
  openapi: '3.1.0',
  info: { title: 'DT65 API', version: '1.0.0' },
});
app.get('/scalar', Scalar({ url: '/doc' }));

export default app;
```

### Event Zod Schema with OpenAPI Metadata
```typescript
import { z } from '@hono/zod-openapi';

const EventTypeSchema = z.enum([
  'CYCLING', 'KARONKKA', 'MEETING', 'NORDIC_WALKING',
  'ICE_HOCKEY', 'ORIENTEERING', 'OTHER', 'RUNNING',
  'SKIING', 'SPINNING', 'SWIMMING', 'TRACK_RUNNING',
  'TRAIL_RUNNING', 'TRIATHLON', 'ULTRAS',
]).openapi({ example: 'RUNNING' });

const CreateEventSchema = z.object({
  type: EventTypeSchema,
  title: z.string().min(1).openapi({ example: 'Morning Run' }),
  dateStart: z.string().date().openapi({ example: '2026-04-15' }),
  timeStart: z.string().optional().openapi({ example: '08:00' }),
  location: z.string().optional().openapi({ example: 'Central Park' }),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  race: z.boolean().default(false).openapi({ example: false }),
}).openapi('CreateEvent');
```

### API Key Middleware with Timing-Safe Comparison
```typescript
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const apiKeyMiddleware = () =>
  createMiddleware(async (c, next) => {
    const apiKey = c.req.header('x-api-key');
    if (!apiKey) {
      throw new HTTPException(401, { message: 'Missing API key' });
    }

    const expected = new TextEncoder().encode(c.env.X_API_KEY);
    const received = new TextEncoder().encode(apiKey);

    if (expected.byteLength !== received.byteLength) {
      throw new HTTPException(401, { message: 'Invalid API key' });
    }

    const isValid = crypto.subtle.timingSafeEqual(expected, received);
    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid API key' });
    }

    await next();
  });
```

### Vitest Setup with D1 Migrations
```typescript
// vitest.config.ts
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';
import path from 'node:path';

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, 'drizzle');
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      setupFiles: ['./src/__tests__/setup.ts'],
      poolOptions: {
        workers: {
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
          },
          wrangler: { configPath: './wrangler.jsonc' },
        },
      },
    },
  };
});

// src/__tests__/setup.ts
import { applyD1Migrations, env } from 'cloudflare:test';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hono/jwt` with symmetric secrets | `hono/jwk` with JWKS URI | Hono 4.x (2025) | Native Auth0/OIDC support; no manual key management |
| `@hono/swagger-ui` | `@scalar/hono-api-reference` | 2024-2025 | Better UI, more features, actively maintained |
| Zod v3 with `.openapi()` extension | Zod v4 native + `@hono/zod-openapi` v4 support | Aug 2025 | `.meta()` support in Zod v4; `@hono/zod-openapi` handles compatibility |
| `@cloudflare/vitest-pool-workers` with `wrangler.toml` | Same package with `wrangler.jsonc` + Vite plugin | 2025-2026 | JSON config is now preferred; Vite plugin simplifies dev |

**Deprecated/outdated:**
- `hono/jwt` with symmetric `secret` param: Use `hono/jwk` for asymmetric (RS256) Auth0 tokens
- Manual `@cloudflare/workers-types` installation: `wrangler types` auto-generates `worker-configuration.d.ts`

## Open Questions

1. **@hono/zod-openapi 1.2.1 vs newer version for Zod v4**
   - What we know: Zod v4 support issue was closed Aug 2025. The catalog has version 1.2.1. The npm page shows 1.2.2 as latest.
   - What's unclear: Whether 1.2.1 already includes Zod v4 support or if it requires 1.2.2+. The beta was announced June 2025.
   - Recommendation: Verify by installing and testing. If 1.2.1 fails with Zod v4, bump to 1.2.2 in catalog.

2. **VarLock env access pattern in OpenAPIHono bindings**
   - What we know: Current `index.ts` uses `ENV.TEST_VALUE` from `varlock/env`. Workers bindings (DB, secrets) come via `c.env`.
   - What's unclear: Whether VarLock env values are also available as Cloudflare Workers bindings (via `c.env`) or only through the VarLock import. The `X_API_KEY` is listed as `infisical()` in `.env.schema`.
   - Recommendation: Use `c.env.X_API_KEY` for Workers-native access (simpler for middleware). Verify VarLock resolves values into the Workers env bindings at build time.

3. **AUTH0_DOMAIN and AUTH0_AUDIENCE env vars**
   - What we know: These are needed for JWT validation but are not yet defined in `.env.schema` or `wrangler.jsonc`.
   - What's unclear: Whether they should be VarLock-managed secrets or plain wrangler vars.
   - Recommendation: Add as non-sensitive vars in `.env.schema` and `wrangler.jsonc` (they are public values: the Auth0 tenant domain and API identifier).

4. **Event ID generation strategy for new events**
   - What we know: Existing migrated events use ULIDs from DynamoDB. The `id` column is `TEXT PRIMARY KEY`.
   - What's unclear: Whether new events should also use ULIDs for consistency or switch to `crypto.randomUUID()`.
   - Recommendation: Use `crypto.randomUUID()` for simplicity (available in Workers runtime). ULIDs were a DynamoDB convention; UUIDs are equally valid as text primary keys.

## Sources

### Primary (HIGH confidence)
- [Hono JWK Middleware docs](https://hono.dev/docs/middleware/builtin/jwk) - Full configuration options, Auth0 JWKS integration, `allow_anon` option
- [Hono Zod OpenAPI example](https://hono.dev/examples/zod-openapi) - Route definition, schema setup, OpenAPIHono usage
- [Hono Cloudflare Vitest example](https://hono.dev/examples/cloudflare-vitest) - Integration testing with `app.request()` and `cloudflare:test` env
- [Cloudflare Workers Vitest integration docs](https://developers.cloudflare.com/workers/testing/vitest-integration/) - D1 migration helpers, test APIs
- Existing codebase: `apps/api/` (Hono setup, Drizzle schema, wrangler config, vitest config)

### Secondary (MEDIUM confidence)
- [GitHub issue #1177](https://github.com/honojs/middleware/issues/1177) - @hono/zod-openapi Zod v4 support confirmed resolved Aug 2025
- [Scalar Hono integration](https://hono.dev/examples/scalar) - `@scalar/hono-api-reference` setup pattern
- [hono-open-api-starter](https://github.com/w3cj/hono-open-api-starter) - Feature-based route organization pattern (index/routes/handlers/schemas)

### Tertiary (LOW confidence)
- @hono/zod-openapi 1.2.1 Zod v4 compatibility: Need to verify if catalog version includes Zod v4 support or needs bump to 1.2.2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already in project or catalog; versions confirmed
- Architecture: HIGH - Well-documented patterns from official Hono docs and community starters
- Pitfalls: HIGH - Schema gap identified by code inspection; middleware patterns verified against docs

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable ecosystem, 30-day validity)
