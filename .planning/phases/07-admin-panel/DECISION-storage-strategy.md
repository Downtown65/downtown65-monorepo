# Decision: Fee & Role Storage Strategy

**Date:** 2026-03-23
**Status:** Proposed
**Task:** dt65-6eb.1

## Context

The admin panel needs to display and manage:
- **Per user:** nickname, name, email, role, active/inactive, fee status, join date, last login
- **Fee tracking:** paid/unpaid per member per calendar year

Current D1 `users` table stores only: `auth0_sub`, `nickname`, `picture`, `created_at`, `updated_at`. It does NOT store email, name, role, or last login — those live in Auth0.

## Options Evaluated

### Option A: Auth0 app_metadata for roles + fees (Recommended)

Store `role` and `fees` in Auth0 `app_metadata` per user:

```json
{
  "role": "admin",
  "fees": {
    "2025": true,
    "2026": false
  }
}
```

**Pros:**
- Single source of truth — no sync between systems
- `app_metadata` is tamper-proof (only backend can write)
- Comes back with `GET /api/v2/users` — no extra API calls
- Can be added to JWT via Post Login Action (role claim for access control)
- Searchable via Management API (`q=app_metadata.role:"admin"`)

**Cons:**
- Management API rate limit: 2 req/s on free Auth0 plan (15 req/s on paid)
- No SQL joins — can't query "all users who paid for 2026" with D1 data in one query
- Dependent on Auth0 availability for admin operations

### Option B: D1 tables for roles + fees

Add `role` and `active` columns to `users` table. Add `membership_fees` table.

**Pros:**
- Full SQL queries, joins with events/participation
- No external API dependency for reads
- Strong consistency

**Cons:**
- Duplicates Auth0 role data — need dual writes and sync logic
- Still need Management API for email, name, last_login (not in D1)
- Role can drift between Auth0 and D1

### Option C: Cloudflare KV for caching

Use KV as read cache in front of Auth0 or D1.

**Pros:**
- Sub-millisecond reads at edge when cached

**Cons:**
- Eventually consistent (up to 60s propagation)
- No structured queries — only key-value lookup
- Adds complexity for ~100 users where latency isn't a concern
- Still needs a source of truth (Auth0 or D1)

## Decision: Option A — Auth0 app_metadata

**For ~100 club members, Auth0 Management API is sufficient for all admin operations.**

### Rationale

1. **Admin panel already requires Management API.** Email, name, and last_login only exist in Auth0. The user list page must call `GET /api/v2/users` regardless — adding role and fees to app_metadata costs nothing extra.

2. **No duplication.** Roles in app_metadata + JWT claims means one source of truth. No sync bugs.

3. **Scale is tiny.** ~100 members = 2 paginated API calls to list all users. Even on free tier (2 req/s), bulk fee updates for 100 users take ~50 seconds — acceptable for a yearly operation.

4. **KV adds no value.** With ~100 users and admin-only access, caching is unnecessary overhead.

5. **D1 changes minimal.** No schema migration needed for roles or fees. D1 stays focused on events and participation.

### Why app_metadata over Auth0 RBAC Roles API

Auth0 has a dedicated Roles API (`/api/v2/roles`), but:
- Listing users by role requires separate API calls per role
- User list endpoint does NOT include RBAC roles — requires `GET /api/v2/users/{id}/roles` per user (100 calls for 100 users)
- `app_metadata.role` comes back in the user list for free

We use `app_metadata.role` as the role field and add it to JWT access tokens via a Post Login Action. This gives us both queryable roles in the admin panel and role-based access control in the API.

### Implementation Summary

| Data | Where it lives | How API reads it | How admin writes it |
|------|----------------|------------------|---------------------|
| Role | Auth0 `app_metadata.role` | JWT custom claim (Post Login Action) | Management API `PATCH /users/{id}` |
| Fee status | Auth0 `app_metadata.fees.{year}` | Management API `GET /users` | Management API `PATCH /users/{id}` |
| Active/inactive | Auth0 `blocked` field | Management API `GET /users` | Management API `PATCH /users/{id}` |
| Email, name | Auth0 profile | Management API `GET /users` | Not editable by admin |
| Nickname, picture | D1 `users` table | D1 query | Not editable by admin (synced from Auth0) |
| Last login | Auth0 `last_login` | Management API `GET /users` | Not editable |

### Auth0 Post Login Action (pseudocode)

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const role = event.user.app_metadata?.role || 'member';
  api.accessToken.setCustomClaim('https://downtown65.com/role', role);
};
```

### API Role Middleware (pseudocode)

```typescript
// Extract role from JWT custom claim
const role = payload['https://downtown65.com/role'] as string;
// Gate admin endpoints
if (!['admin', 'board_member'].includes(role)) {
  throw new HTTPException(403);
}
```

### D1 Schema: No Changes

The D1 `users` table remains as-is. No new tables or columns needed for roles or fees.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Auth0 free tier rate limit (2 req/s) | Sufficient for ~100 members. Upgrade to paid if needed. |
| Auth0 outage blocks admin panel | Acceptable — admin panel is not user-facing. Events app uses cached JWTs. |
| app_metadata grows unbounded with fee years | Each year adds ~20 bytes. At 50 years = 1KB. Not a concern. |
| Role in app_metadata vs RBAC is non-standard | Document clearly. Can migrate to RBAC later if needed. |

## Future Considerations

- If the club grows beyond ~500 members, consider caching user lists in D1 or KV
- If Auth0 RBAC becomes needed for other features, migrate role from app_metadata to RBAC roles
- Fee history could move to D1 if complex queries are needed (e.g., multi-year reports)
