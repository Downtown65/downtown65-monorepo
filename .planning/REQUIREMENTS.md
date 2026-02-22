# Requirements: Downtown 65 Ecosystem

**Defined:** 2026-02-22
**Core Value:** Members can create sporting events and other members can join them

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Member can log in via Auth0 Lock component and session persists across browser refresh
- [ ] **AUTH-02**: Member can log out from any page
- [ ] **AUTH-03**: Member can reset password via Auth0 Lock forgot-password flow
- [ ] **AUTH-04**: New member can sign up with email, nickname, name, password, and registerSecret field
- [ ] **AUTH-05**: Signup is guarded by a shared registerSecret that must match to complete registration
- [ ] **AUTH-06**: Participants displayed by their nickname on events

### Events

- [ ] **EVNT-01**: Member can create event with type (15 types), date, time, location, title, subtitle, description, race flag
- [ ] **EVNT-02**: Member can edit their own events
- [ ] **EVNT-03**: Member can delete their own events
- [ ] **EVNT-04**: Member can join an event
- [ ] **EVNT-05**: Member can leave an event
- [ ] **EVNT-06**: Member can view chronological list of upcoming events
- [ ] **EVNT-07**: Member can view event details with participant list

### Email

- [ ] **MAIL-01**: Email sent to opted-in members when a new event is created
- [ ] **MAIL-02**: Member can opt in/out of email notifications

### Infrastructure

- [ ] **INFR-01**: TypeScript monorepo with pnpm workspaces
- [ ] **INFR-02**: Biome linting/formatting, Knip dead code detection, Sherif dependency consistency
- [ ] **INFR-03**: Lefthook pre-push hooks (lint, typecheck, knip)
- [ ] **INFR-04**: GitHub Actions CI pipeline
- [ ] **INFR-05**: Vitest unit/integration tests, Playwright E2E tests
- [ ] **INFR-06**: CLAUDE.md project instructions
- [ ] **INFR-07**: API on Cloudflare Workers (Hono + Zod OpenAPI + Drizzle D1)
- [ ] **INFR-08**: Events app (React Router 7 + Mantine + Tabler Icons)
- [ ] **INFR-09**: Mobile-responsive UI

### Data

- [ ] **DATA-01**: D1 database schema for events, participation, email preferences
- [ ] **DATA-02**: ~1000 existing events migrated from DynamoDB to D1

### Website

- [ ] **SITE-01**: Static club information pages (Astro + Tailwind)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: External participant lightweight accounts for spinning events
- **AUTH-V2-02**: Scoped access — external participants see only invited events

### Email

- **MAIL-V2-01**: Weekly Monday morning email digest of upcoming events

### PWA

- **PWA-V2-01**: PWA install prompt and add-to-home-screen
- **PWA-V2-02**: Service worker offline shell

### Events

- **EVNT-V2-01**: Event type filtering on listing page
- **EVNT-V2-02**: Race event visual indicator/badge

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile apps | PWA covers mobile needs for ~100 members |
| Real-time updates (WebSockets) | RSVP workflow doesn't need real-time for ~100 members |
| Payment processing | Club handles finances separately |
| In-app chat/messaging | Club uses WhatsApp/Telegram |
| OAuth social login | Auth0 email/password sufficient for known members |
| Event capacity limits/waitlists | Not needed — social coordination handles capacity |
| Content management system | Static Astro pages edited in code |
| Advanced search/filtering | ~20 events/month is scannable visually |
| User profile editing in-app | Auth0 manages profiles — only email preferences stored locally |
| Multi-language support | Club operates in Finnish |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| EVNT-01 | — | Pending |
| EVNT-02 | — | Pending |
| EVNT-03 | — | Pending |
| EVNT-04 | — | Pending |
| EVNT-05 | — | Pending |
| EVNT-06 | — | Pending |
| EVNT-07 | — | Pending |
| MAIL-01 | — | Pending |
| MAIL-02 | — | Pending |
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| INFR-04 | — | Pending |
| INFR-05 | — | Pending |
| INFR-06 | — | Pending |
| INFR-07 | — | Pending |
| INFR-08 | — | Pending |
| INFR-09 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| SITE-01 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after initial definition*
