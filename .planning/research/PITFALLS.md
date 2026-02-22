# Pitfalls Research

**Domain:** Sports club event management ecosystem (Cloudflare Workers + D1, Auth0, DynamoDB migration, React Router 7 PWA, pnpm monorepo)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH (verified against official Cloudflare docs, community reports, and GitHub issues)

## Critical Pitfalls

### Pitfall 1: DynamoDB-to-D1 Schema Translation Mismatch

**What goes wrong:**
DynamoDB's single-table design with partition keys, sort keys, and denormalized data does not map directly to relational SQLite tables. Teams attempt a naive 1:1 table translation, carrying over DynamoDB's composite key patterns into D1 without normalizing. The result is a schema that is neither good NoSQL nor good relational -- queries become awkward, joins are missing where they should exist, and the denormalized data creates update anomalies in a relational context.

**Why it happens:**
The existing DynamoDB schema was designed around access patterns (as NoSQL should be), not entity relationships. Developers copy the structure rather than re-modeling for a relational database. With ~1000 events plus participation records, the migration seems trivially small, so schema design gets insufficient attention.

**How to avoid:**
- Map entities first (events, participants, event types, preferences), not DynamoDB table structure
- Design the D1 schema from scratch as a normalized relational model with proper foreign keys
- Write the Drizzle ORM schema driven by the application's query needs, not the DynamoDB export shape
- Build a migration script that transforms DynamoDB items into normalized relational rows
- Test with real exported DynamoDB data, not synthetic test data

**Warning signs:**
- Schema has columns named `pk`, `sk`, `GSI1PK`, `GSI1SK` or similar DynamoDB partition/sort key patterns
- Single table contains multiple entity types (events and participants in one table)
- No foreign key constraints defined between related tables
- JSON blob columns storing structured data that should be separate columns or tables

**Phase to address:**
Phase 1 (Foundation/Infrastructure) -- Schema design and data migration must happen before any application code depends on the database structure.

---

### Pitfall 2: AWS SDK v3 Incompatible with Cloudflare Workers Runtime

**What goes wrong:**
The AWS JavaScript SDK v3 (`@aws-sdk/client-ses`) imports Node.js-specific modules like `node:fs` through its `@smithy` dependency chain. Cloudflare Workers run on the V8 isolate (not Node.js), so these imports fail at runtime with cryptic errors like "t is not a function" or module-not-found errors. The Worker deploys but crashes when attempting to send email via SES.

**Why it happens:**
Developers install `@aws-sdk/client-ses` because it is the official AWS SDK. It works perfectly in Node.js environments and even in local Wrangler dev mode (which may polyfill some Node APIs). The failure only manifests in the deployed Worker.

**How to avoid:**
- Use `aws4fetch` instead of the AWS SDK v3 for signing SES API requests from Workers
- `aws4fetch` uses the Web Crypto API and `fetch()` which are native to the Workers runtime
- Sign SES v2 API requests manually using AWS Signature Version 4 via `aws4fetch`
- Store AWS credentials (access key, secret key) as Worker secrets, never in code
- Test email sending in deployed preview environments, not just local dev

**Warning signs:**
- `@aws-sdk/*` packages appearing in Worker package dependencies
- Build succeeding but runtime errors mentioning `node:` modules
- Email functionality working locally but failing in production

**Phase to address:**
Phase 2 (API Development) -- When implementing email notification endpoints. Must be validated before building the weekly digest cron trigger.

---

### Pitfall 3: D1 Single-Writer Bottleneck Under Concurrent Event Joins

**What goes wrong:**
D1 is single-threaded -- all write queries serialize through one actor. When multiple members simultaneously join/leave an event (common scenario: Monday spinning event with 15+ participants all responding to the notification email within minutes), writes queue up. If the queue fills, D1 returns "overloaded" errors, causing join/leave operations to fail silently or with cryptic errors.

**Why it happens:**
D1's architecture routes all writes to a single Durable Object. At ~1ms per simple INSERT, this supports ~1000 writes/second, which is plenty for ~100 members. However, if queries are not optimized (complex JOINs, missing indexes, or transactions involving multiple tables), each write could take 10-100ms, dropping throughput to 10-100 writes/second. Combined with read queries also serializing, a burst of activity can exceed capacity.

**How to avoid:**
- Keep participation mutations (join/leave) as simple single-INSERT/DELETE operations -- no subqueries
- Add indexes on frequently queried columns: event_id on participations, date on events
- Use `db.batch()` for multi-statement operations instead of sequential calls (D1 does not support `BEGIN`/`COMMIT`)
- Monitor query execution times during development; any query over 5ms should be investigated
- For the ~100 member club, this is unlikely to be a real problem, but write defensive code anyway

**Warning signs:**
- D1 "overloaded" errors in production logs
- Participation operations intermittently failing
- Query execution times reported by D1 analytics exceeding 10ms for simple operations
- Missing indexes on foreign key columns

**Phase to address:**
Phase 2 (API Development) -- Schema indexes and query patterns must be validated during API implementation. Load testing with realistic concurrent joins should happen before launch.

---

### Pitfall 4: Drizzle D1 Migrations Have No Rollback

**What goes wrong:**
Drizzle ORM does not generate "down" migrations. Once a migration is applied to D1 in production, there is no automated way to revert it. A bad migration (wrong column type, dropped column, corrupted constraint) requires manually writing a corrective migration and hoping the data can be recovered. D1 also does not support `BEGIN`/`COMMIT` for transactional DDL, so a multi-step migration that fails partway through leaves the schema in an inconsistent state.

**Why it happens:**
Drizzle's philosophy is forward-only migrations. D1's lack of transaction support for DDL compounds this -- you cannot wrap schema changes in a transaction. Developers accustomed to other ORMs (Prisma, Knex) that support rollbacks get burned when they need to revert a production schema change.

**How to avoid:**
- Use D1 Time Travel (point-in-time restore) as the safety net: 30 days on paid plan, 7 days on free
- Always back up the database before applying migrations: `wrangler d1 export`
- Keep migrations small and atomic -- one logical change per migration file
- Test every migration against a local D1 copy with production data before applying to production
- Never edit a migration file after it has been applied to any environment
- For destructive changes (dropping columns/tables), use a two-phase approach: deprecate in one migration, remove in a later one after confirming no code references remain

**Warning signs:**
- Large migration files with multiple ALTER TABLE statements
- Migration files being edited after initial generation
- No database backup step in the deployment pipeline
- Schema changes being applied directly to production without staging environment testing

**Phase to address:**
Phase 1 (Foundation) -- Migration strategy and backup procedures must be established before any schema is applied to production D1.

---

### Pitfall 5: Auth0 JWT Verification Failing Due to JWKS Key Rotation

**What goes wrong:**
The Worker caches the Auth0 JWKS (JSON Web Key Set) at startup or on first request. Auth0 rotates signing keys periodically. When rotation happens, the cached public key no longer matches the `kid` (Key ID) in new JWTs. All authenticated requests start returning 401 errors. The app appears completely broken for all members until the Worker cache refreshes.

**Why it happens:**
Developers fetch the JWKS once and cache it indefinitely (or for too long). Workers are stateless across requests, but JWKS fetch results may be cached in memory within a single isolate's lifetime or in KV/cache. Without a re-fetch strategy triggered by `kid` mismatch, key rotation causes a hard outage.

**How to avoid:**
- Use `jose` library's `createRemoteJWKSet()` which automatically handles key caching and rotation
- Implement `kid`-based lookup: if the JWT's `kid` does not match any cached key, re-fetch JWKS before rejecting
- Cache JWKS with a TTL of 1 hour maximum, not indefinitely
- Never hardcode the public key -- always fetch from `https://[tenant].auth0.com/.well-known/jwks.json`
- Test key rotation in a staging Auth0 tenant before going live

**Warning signs:**
- Hardcoded public keys or certificates in Worker code/secrets
- No `kid` matching logic in JWT verification code
- JWKS fetched once at Worker startup without refresh mechanism
- All authenticated requests suddenly failing with 401

**Phase to address:**
Phase 2 (API Development) -- Auth middleware must be implemented with rotation-resilient JWKS handling from the start.

---

### Pitfall 6: React Router 7 SPA Routing Conflicts with Cloudflare Workers Assets

**What goes wrong:**
When deploying a React Router 7 SPA to Cloudflare Workers, the Workers static assets handler intercepts navigation requests before the Worker's fetch handler executes. Requests to `/events/123` intended for client-side routing get served `index.html` correctly, but API routes like `/api/events` on the same Worker also get intercepted by the SPA fallback, returning HTML instead of JSON. Alternatively, if not configured as SPA, deep links return 404 because there is no physical file at `/events/123`.

**Why it happens:**
Cloudflare Workers' `not_found_handling = "single-page-application"` setting intercepts all navigation requests (those with `Sec-Fetch-Mode: navigate`) and serves `index.html`. This conflicts when the API and SPA are served from the same Worker. The distinction between "frontend route" and "API route" is lost at the infrastructure level.

**How to avoid:**
- Deploy API and frontend as separate Workers with distinct routes/domains (e.g., `api.dt65.fi` and `app.dt65.fi`)
- If co-located, use the Worker fetch handler to explicitly route `/api/*` requests before the SPA fallback
- Configure `wrangler.toml` with proper `routes` and asset handling rules
- Test deep linking, page refresh on nested routes, and API calls in deployed preview environments
- Use React Router 7's framework mode with Cloudflare adapter rather than pure SPA mode if server-side rendering is desired

**Warning signs:**
- API calls returning HTML content instead of JSON
- Deep links working in development but returning 404 in production
- Browser navigation working but page refresh breaking on nested routes
- SPA mode configuration documented as "not currently supported" with Cloudflare Vite plugin (confirmed in Cloudflare Workers SDK issues)

**Phase to address:**
Phase 1 (Foundation) -- Deployment architecture (separate Workers vs. monolithic) must be decided before building either the API or the frontend.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing event types as string enums in code instead of a lookup table | Faster initial development, no migration needed for type changes | Adding/renaming event types requires code deployment; cannot query events by type metadata | Acceptable for MVP with 15 fixed types. Migrate to lookup table if types become user-configurable |
| Skipping D1 database indexes on foreign keys | Faster initial migration, simpler schema | Full table scans on participation lookups, degrading performance as data grows | Never -- always index foreign key columns from day one, even for ~1000 rows |
| Hardcoding Auth0 tenant URL in Worker code | Quick setup, no config management | Impossible to test with staging Auth0 tenant; breaks if tenant URL changes | Never -- use environment variables/secrets from the start |
| Using `any` types for DynamoDB migration transforms | Faster migration script development | Type errors in transformed data go undetected; corrupted data in D1 | Acceptable only during initial migration script prototyping; add proper types before running against real data |
| Inlining email HTML templates in Worker code | No template system to set up | Impossible to preview emails; content changes require deployment; messy code | MVP only. Move to template files or component-based email generation before adding the second email type |
| Skipping service worker / PWA manifest for initial launch | Faster frontend delivery | Users cannot install the app; no offline capability; no push notification foundation | Acceptable for first working version. Add PWA manifest in frontend polish phase |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth0 from Workers | Using Auth0 Node.js SDK (`auth0` npm package) which depends on Node.js APIs | Use `jose` for JWT verification with `createRemoteJWKSet()`. Auth0 Management API calls (if needed) use REST API directly via `fetch()` |
| AWS SES from Workers | Installing `@aws-sdk/client-ses` which bundles Node.js dependencies | Use `aws4fetch` to sign SES v2 API requests using Web Crypto APIs native to Workers |
| Drizzle with D1 | Using `db.transaction()` which calls SQL `BEGIN`/`COMMIT` -- not supported in D1 | Use `db.batch([...])` which uses D1's native batch API for multi-statement atomicity |
| D1 foreign keys during migration | Running data import with `INSERT` statements that violate foreign key order | Use `PRAGMA defer_foreign_keys = on` at the start of batch imports; ensure parent rows are inserted before child rows |
| Cloudflare Workers Cron + SES | Assuming cron handler has unlimited execution time | Free plan: 10ms CPU; paid plan: 30 seconds for triggers <1 hour, 15 minutes for >=1 hour. Weekly digest must complete within these limits. For ~100 members, batch the email sends |
| pnpm workspace dependencies in Cloudflare Builds | Assuming Cloudflare will resolve workspace `workspace:*` protocol dependencies correctly | Cloudflare installs all workspace projects even when only one is being deployed. Use `--filter` flags or Turborepo to isolate the build. Or deploy via `wrangler deploy` from CI (GitHub Actions) instead of Cloudflare Builds |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries for event listings with participant counts | Event list page takes >500ms; D1 analytics shows dozens of queries per page load | Use SQL JOIN with GROUP BY to fetch events and participant counts in one query via Drizzle's `leftJoin` | Noticeable at >50 events on a single page; unacceptable at >200 |
| Fetching all events without pagination | Increasing response sizes; slow page loads; Worker memory approaching 128MB limit | Implement cursor-based or offset pagination from day one; limit default page size to 20-50 events | At ~1000 events with full descriptions, response exceeds 1MB; at 5000+ events, Worker memory limit approached |
| Full Zod schema validation on every request in hot paths | CPU time approaching limits on free plan (10ms); occasional `Worker exceeded CPU time limit` errors | Pre-compile Zod schemas; keep validation schemas focused (validate only what changes); consider moving to paid plan if CPU becomes an issue | Complex nested schemas with 20+ fields can consume 2-5ms of CPU; combined with auth + query, may exceed 10ms on free plan |
| Loading full JWKS on every request | 50-100ms added to every authenticated request due to external JWKS fetch | `createRemoteJWKSet()` caches keys automatically; alternatively cache JWKS in Worker global scope or KV with 1-hour TTL | First request after Worker cold start is always slow; subsequent requests should use cached keys |
| Unbatched DynamoDB export reads during migration | Migration script times out or gets throttled by DynamoDB | Export DynamoDB table to S3 as JSON using DynamoDB Export to S3 feature (no read capacity consumed); then transform and import to D1 | Any table over ~1000 items with provisioned capacity |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Auth0 client secret in frontend PWA code | Attacker can impersonate the application, issue tokens, access Management API | Client secret is never used in SPAs. Use Authorization Code Flow with PKCE for the PWA; only the Worker API needs secrets |
| Not validating JWT `aud` (audience) claim | Any valid Auth0 token (from any application in the tenant) can access the API | Always verify `aud` matches the specific API identifier registered in Auth0; reject tokens with wrong audience |
| Storing AWS SES credentials as plaintext in `wrangler.toml` | Credentials committed to git; anyone with repo access can send emails as the club | Use `wrangler secret put` for AWS credentials; never put secrets in `wrangler.toml` or environment variables in config files |
| Missing CORS configuration on API Worker | Frontend on a different subdomain cannot call the API; or overly permissive CORS allows any origin | Configure explicit `Access-Control-Allow-Origin` for the PWA's domain only; handle preflight OPTIONS requests in Hono middleware |
| External participant tokens with full member permissions | External spinning participants can see/modify all club events, not just the spinning events they were invited to | Create a separate Auth0 role/scope for external participants; enforce scope-based access control in the API middleware |
| Returning detailed error messages for auth failures | Attackers learn about token structure, key rotation timing, valid user IDs | Return generic 401/403 responses; log detailed errors server-side only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No optimistic UI for event join/leave | User clicks "join", waits 500ms-2s for D1 write round-trip, no feedback | Show immediate UI state change; revert if the API call fails. Use React state + mutation pattern |
| PWA not handling offline gracefully for event viewing | User opens app with no connectivity, sees blank page or error | Cache the event list in service worker; show cached events with "offline" indicator; disable join/leave actions |
| Ignoring iOS Safari safe-area-inset for bottom navigation | Bottom navigation or action buttons hidden behind iOS Safari's bottom toolbar | Use `env(safe-area-inset-bottom)` in CSS; test on actual iOS devices, not just Chrome DevTools mobile simulation |
| Email notifications with no way to deep-link to events | User reads "New event: Thursday cycling" in email but must navigate manually in the app | Include direct deep links to event detail pages in all notification emails; ensure the PWA handles these links correctly |
| Event creation form losing data on accidental navigation | User fills out 5 fields, accidentally swipes back, loses all input | Use form state persistence (localStorage or React Router's `useBlocker`); warn before navigating away from dirty forms |
| Finnish characters (a, o, u, etc.) breaking in URL slugs or search | Events with Finnish titles display incorrectly or fail search/filter | Use proper UTF-8 encoding throughout; test with real Finnish event titles like "Pyoraily Kalliossa" and "Hiihtoretki Nuuksioon" |

## "Looks Done But Isn't" Checklist

- [ ] **Auth middleware:** Often missing `aud` claim validation -- verify JWT validation checks issuer AND audience AND expiration
- [ ] **Event CRUD:** Often missing authorization check on edit/delete -- verify only the event creator (or admin) can modify an event
- [ ] **Email notifications:** Often missing unsubscribe mechanism -- verify email preferences are checked before sending AND unsubscribe link is included in every email (required by law in Finland/EU)
- [ ] **D1 schema:** Often missing indexes on foreign keys -- verify every foreign key column has an index
- [ ] **PWA manifest:** Often missing all required icon sizes -- verify 192x192 and 512x512 icons are present for installability
- [ ] **CORS:** Often missing preflight (OPTIONS) handler -- verify browser can actually make cross-origin API requests, not just curl
- [ ] **Data migration:** Often missing validation of migrated data -- verify row counts match between DynamoDB export and D1 import; spot-check 10 random events for data integrity
- [ ] **Cron email digest:** Often missing error handling for partial failures -- verify that one failed email does not prevent the remaining ~99 from sending
- [ ] **External participants:** Often missing access scope restrictions -- verify external participants cannot see events outside their permitted type
- [ ] **Service worker updates:** Often missing update notification to users -- verify that when a new version deploys, active users are notified to refresh

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bad D1 migration corrupts schema | MEDIUM | Use D1 Time Travel to restore to pre-migration point (30 days on paid). Fix migration. Re-apply. If >30 days, restore from manual backup |
| AWS credentials leaked in git | HIGH | Immediately rotate AWS access keys in IAM console. Audit SES sending logs for unauthorized use. Use `git filter-branch` or BFG to purge from history. Add `.env` to `.gitignore` |
| DynamoDB migration loses/corrupts data | LOW | Re-run migration from DynamoDB export (source data unchanged in DynamoDB). Fix transformation script. Validate with checksum comparison |
| Auth0 key rotation causes outage | LOW | Re-deploy Worker to clear cached JWKS. Or wait for `createRemoteJWKSet()` cache to expire (typically minutes). Fix by implementing proper `kid`-based key lookup |
| SPA routing broken in production | LOW | Revert `wrangler.toml` routing configuration. Or fix `not_found_handling` setting. Deploy via `wrangler deploy`. Frontend works immediately after deploy propagation (~1 min) |
| pnpm workspace build failure in Cloudflare | MEDIUM | Switch to deploying via GitHub Actions `wrangler deploy` instead of Cloudflare Builds. Build locally/in CI first, then push the built artifact |
| N+1 query performance degradation | LOW | Add missing JOIN queries and indexes. Deploy updated API. Performance improves immediately with no data changes needed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| DynamoDB-to-D1 schema mismatch | Phase 1: Foundation | Normalized schema review; migration script tested with real DynamoDB export; row count validation |
| AWS SDK v3 incompatible with Workers | Phase 2: API Development | `aws4fetch` used instead; email sending tested in deployed preview Worker (not just local) |
| D1 single-writer bottleneck | Phase 2: API Development | D1 analytics showing <5ms for participation mutations; indexes on all FK columns verified |
| Drizzle migrations no rollback | Phase 1: Foundation | Backup procedure documented; Time Travel tested; migration tested on local D1 copy before production |
| Auth0 JWKS key rotation failure | Phase 2: API Development | `jose` + `createRemoteJWKSet()` used; manual key rotation tested in staging Auth0 tenant |
| SPA routing conflicts with Workers assets | Phase 1: Foundation | Deployment architecture decided (separate Workers confirmed); deep links tested in production; API returns JSON not HTML |
| N+1 queries for event listings | Phase 2: API Development | D1 analytics queried; event list endpoint uses <=3 queries total |
| iOS Safari viewport overlap | Phase 3: Frontend/PWA | Tested on physical iOS device; safe-area-inset-bottom applied to bottom navigation |
| Finnish character encoding issues | Phase 3: Frontend/PWA | Event CRUD tested with Finnish titles containing a-umlaut, o-umlaut; search/filter works with UTF-8 |
| Email missing unsubscribe / preference check | Phase 2: API Development | Email preference lookup confirmed before each send; unsubscribe link present in email template |
| External participant over-permissioning | Phase 2: API Development | API tests confirming external participant cannot access non-spinning events |
| Monorepo build issues in Cloudflare | Phase 1: Foundation | CI pipeline uses `wrangler deploy` from GitHub Actions, not Cloudflare Builds; workspace isolation confirmed |

## Sources

- [Cloudflare D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) -- Official database limits documentation (HIGH confidence)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) -- Official Workers platform limits (HIGH confidence)
- [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) -- Memory streaming, DNS records (HIGH confidence)
- [D1 Foreign Keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/) -- Foreign key enforcement and defer pragma (HIGH confidence)
- [D1 Read Replication / Sequential Consistency](https://blog.cloudflare.com/d1-read-replication-beta/) -- Single-writer architecture details (HIGH confidence)
- [Building D1: A Global Database](https://blog.cloudflare.com/building-d1-a-global-database/) -- WAL mode, durability, single-threaded model (HIGH confidence)
- [Drizzle ORM Migrations Rollback Discussion #1339](https://github.com/drizzle-team/drizzle-orm/discussions/1339) -- No auto-generated down migrations (MEDIUM confidence)
- [Drizzle ORM D1 Migrations Discussion #1388](https://github.com/drizzle-team/drizzle-orm/discussions/1388) -- D1-specific migration issues (MEDIUM confidence)
- [Fix D1 migration table schema PR #2658](https://github.com/drizzle-team/drizzle-orm/pull/2658) -- D1 migration table schema conformance (MEDIUM confidence)
- [Securing Cloudflare Agents with Auth0](https://auth0.com/blog/securing-cloudflare-agents-with-auth0/) -- JWT verification pattern for Workers (HIGH confidence)
- [JWT Validation at Edge](https://securityboulevard.com/2025/11/how-to-validate-jwts-efficiently-at-the-edge-with-cloudflare-workers-and-vercel/) -- jose library JWKS caching (MEDIUM confidence)
- [aws4fetch for Workers](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/) -- AWS request signing without SDK (HIGH confidence)
- [AWS SDK v3 Workers issue #6284](https://github.com/aws/aws-sdk-js-v3/discussions/6284) -- node:fs import failure in Workers (MEDIUM confidence)
- [SES Emails from Workers](https://www.ai.moda/en/blog/ses-emails-from-workers) -- aws4fetch SES integration guide (MEDIUM confidence)
- [pnpm Monorepo Workers SDK Issue #10941](https://github.com/cloudflare/workers-sdk/issues/10941) -- Workspace-wide dependency installation problem (MEDIUM confidence)
- [Workers Build Cache Monorepo Issue](https://community.cloudflare.com/t/workers-build-cache-not-working-as-expected-in-monorepos-pnpm/803213) -- Build cache failures with pnpm (MEDIUM confidence)
- [React Router 7 Cloudflare Deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/) -- Official React Router on Workers guide (HIGH confidence)
- [SPA Routing Conflict Issue #8879](https://github.com/cloudflare/workers-sdk/issues/8879) -- Routing conflict with Cloudflare Vite plugin (MEDIUM confidence)
- [Mantine iOS Safari Issue #8326](https://github.com/mantinedev/mantine/issues/8326) -- Bottom tab bar overlap in iOS Safari (MEDIUM confidence)
- [Auth0 Free Plan Limits](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/rate-limit-policy/rate-limit-configurations/free-public) -- Rate limits on free tier (HIGH confidence)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) -- Scheduled handler limits and configuration (HIGH confidence)

---
*Pitfalls research for: DT65 sports club event management ecosystem on Cloudflare*
*Researched: 2026-02-22*
