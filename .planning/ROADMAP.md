# Roadmap: Downtown 65 Ecosystem

## Overview

This roadmap delivers the DT65 sports club ecosystem by building in strict dependency order: monorepo tooling first, then the D1 database with migrated historical data, then the Hono API with event endpoints, then the React Router 7 events application with Auth0 integration, then email notifications via AWS SES, and finally the static Astro website. Each phase delivers a coherent, verifiable capability that unblocks the next. The result is a complete migration from AWS to Cloudflare serving ~100 club members.

**Deployment strategy:** Trunk-based development. Feature/fix branches merge to main via PR. No staging environment -- comprehensive CI checks plus Cloudflare instant rollback is sufficient for ~100 members. All 3 apps deploy on every merge to main (not path-based triggers) because the repo is small and this is the simplest approach.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Monorepo and Tooling** - TypeScript monorepo with pnpm workspaces, code quality tools, CI/CD pipeline with PR preview deploys and auto-deploy on merge, and development conventions
- [ ] **Phase 2: Database and Data Migration** - D1 schema design and migration of ~1000 existing events from DynamoDB
- [ ] **Phase 3: API** - Hono API on Cloudflare Workers with Auth0 JWT validation, event CRUD, participation, and test infrastructure
- [ ] **Phase 4: Events Application** - React Router 7 PWA with Auth0 Lock login, event management UI, and mobile-responsive Mantine layout
- [ ] **Phase 5: Email Notifications** - New event email notifications via AWS SES with member opt-in/out preferences
- [ ] **Phase 6: Static Website** - Astro static site for public club information

## Phase Details

### Phase 1: Monorepo and Tooling
**Goal**: Developers have a fully configured TypeScript monorepo with automated code quality enforcement and a CI/CD pipeline that validates PRs with preview deploys and auto-deploys all apps to production on merge
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-06
**Success Criteria** (what must be TRUE):
  1. Running `pnpm install` from the repo root installs all workspace dependencies and the project builds without errors
  2. Running `pnpm check` (or equivalent) executes Biome linting/formatting, Knip dead code detection, and Sherif dependency consistency checks across all packages
  3. Git push triggers Lefthook pre-push hooks that run lint, typecheck, and knip -- a failing check blocks the push
  4. Opening a PR triggers a GitHub Actions workflow that runs lint, typecheck, knip, test, and build -- the PR shows pass/fail status and a Cloudflare preview deployment URL for each app
  5. Merging a PR to main triggers a GitHub Actions workflow that runs lint, typecheck, knip, test, and build, then deploys all 3 apps to Cloudflare production via `wrangler deploy`
  6. CLAUDE.md exists at the repo root with project conventions that guide Claude during development
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo workspace structure, TypeScript config, code quality tools (Biome, Knip, Sherif), Lefthook pre-push hooks, and CLAUDE.md
- [ ] 01-02-PLAN.md — GitHub Actions CI/CD: PR checks with preview deploys, PR cleanup, production deploy on merge

### Phase 2: Database and Data Migration
**Goal**: D1 database is ready with a normalized schema and all ~1000 historical events migrated from DynamoDB without data loss
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. D1 database has tables for events, participation, and email preferences with proper indexes and foreign key constraints
  2. All ~1000 existing events from DynamoDB are present in D1 with correct data (dates, types, titles, descriptions verified by spot-checking against source)
  3. A migration script exists that can be re-run against a fresh D1 database to reproduce the import from a DynamoDB export
  4. D1 backup procedure is documented and tested -- a backup can be created before any schema migration
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: API
**Goal**: A deployed Hono API on Cloudflare Workers serves all event and participation endpoints with Auth0 JWT-protected access and automated tests
**Depends on**: Phase 2
**Requirements**: INFR-05, INFR-07, EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05, EVNT-06, EVNT-07
**Success Criteria** (what must be TRUE):
  1. API is deployed to Cloudflare Workers and responds to requests at its production URL
  2. Requests without a valid Auth0 JWT are rejected with 401; requests with a valid JWT proceed to the endpoint
  3. A member can create an event via the API with all required fields (type, date, time, location, title, subtitle, description, race flag) and retrieve it back with correct data
  4. A member can edit and delete their own events via the API; attempts to edit/delete another member's events are rejected
  5. A member can join and leave events via the API; the participant list for an event reflects current participants with their nicknames
  6. The API returns a chronological list of upcoming events
  7. Vitest test suite exists with unit and integration tests that run against the Workers runtime and pass in CI
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Events Application
**Goal**: Members can use a mobile-responsive web application to log in, browse events, create/edit events, and join/leave events
**Depends on**: Phase 3
**Requirements**: INFR-08, INFR-09, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. A member can log in via Auth0 Lock component and their session persists across browser refresh (no re-login needed)
  2. A member can log out from any page in the application and is returned to the login screen
  3. A member can reset their password using the Auth0 Lock forgot-password flow
  4. A new user can sign up with email, nickname, name, and password -- registration requires a correct registerSecret value to complete
  5. The events application is deployed as a React Router 7 PWA on Cloudflare Workers and is accessible at its production URL
  6. Event participant lists display members by their nickname
  7. The application is usable on mobile devices -- layout adapts to phone-sized screens without horizontal scrolling or overlapping elements
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Email Notifications
**Goal**: Members receive email notifications for new events and can control their notification preferences
**Depends on**: Phase 3
**Requirements**: MAIL-01, MAIL-02
**Success Criteria** (what must be TRUE):
  1. When a new event is created, an email notification is sent via AWS SES to all members who have opted in to notifications
  2. A member can opt in and opt out of email notifications through the events application, and their preference is respected immediately
  3. Email contains relevant event details (title, type, date, time, location) and is delivered successfully via AWS SES
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Static Website
**Goal**: The public club website is live on Cloudflare with information about Downtown 65
**Depends on**: Phase 4 (links to deployed events app)
**Requirements**: SITE-01
**Success Criteria** (what must be TRUE):
  1. Static site is deployed to Cloudflare and accessible at the club's public URL
  2. Site displays club information pages built with Astro and Tailwind CSS
  3. Site links to the events application and the link resolves to the working PWA
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phase 5 depends on Phase 3 (not Phase 4) and can be parallelized with Phase 4.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo and Tooling | 1/2 | In Progress | - |
| 2. Database and Data Migration | 0/1 | Not started | - |
| 3. API | 0/3 | Not started | - |
| 4. Events Application | 0/3 | Not started | - |
| 5. Email Notifications | 0/1 | Not started | - |
| 6. Static Website | 0/1 | Not started | - |
