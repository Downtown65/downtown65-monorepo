# Downtown 65 Ecosystem

## What This Is

A sports club ecosystem for Downtown 65 (DT65), a Finnish sports team with ~100 members. The system includes a static website for general club information, a PWA events application where members create and join sporting events, and an API backing it all. This is a migration from an existing AWS-based system to Cloudflare, driven by cost reduction and developer experience improvements.

## Core Value

Members can create sporting events and other members can join them — this is the heartbeat of the club and must always work reliably.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Events CRUD — members create, edit, delete events with type, date, time, location, title, subtitle, description, race flag
- [ ] Event participation — members join/leave events
- [ ] 15 event types supported (cycling, running, skiing, swimming, triathlon, etc.)
- [ ] Auth0 authentication and authorization for members
- [ ] External participant support — lightweight accounts that see only specific events (spinning)
- [ ] Weekly email digest — Monday morning summary of upcoming events
- [ ] New event email notification — sent when events are created
- [ ] Email preferences — members opt in/out of notifications
- [ ] Email sending via AWS SES
- [ ] Data migration — ~1000 existing events from DynamoDB to Cloudflare D1
- [ ] Static website — club information pages (Astro + Tailwind)
- [ ] Events PWA — responsive web app for mobile and desktop (React Router 7 + Mantine)
- [ ] API on Cloudflare Workers (Hono + Zod OpenAPI + Drizzle D1)
- [ ] Monorepo with pnpm workspaces
- [ ] Code quality tooling — Biome, Knip, Sherif
- [ ] Git hooks via Lefthook — pre-push lint, typecheck, knip
- [ ] GitHub Actions CI workflows
- [ ] CLAUDE.md project instructions for development conventions
- [ ] Testing — Vitest for unit/integration, Playwright for E2E

### Out of Scope

- Native mobile apps — PWA covers mobile needs for ~100 members
- Real-time features (WebSockets) — not needed for event RSVP workflow
- Payment processing — club handles finances separately
- OAuth social login — Auth0 with email/password sufficient
- Content management system — static Astro pages edited in code
- External participant waitlists or event caps — simple join/leave for now

## Context

- Existing system runs on AWS with DynamoDB, being migrated to Cloudflare for cost and DX
- Auth0 already hosts user information — free tier covers ~100 members
- Skeleton app exists at github.com/pehtoorismies/downtown65-site with initial tech choices
- The club runs regular weekly events (e.g., spinning) with external participants from outside the club
- Finnish-language content in events (titles, descriptions, locations)
- Email sending stays on AWS SES — only infrastructure component not migrating

## Constraints

- **Cost**: Must minimize hosting costs — Cloudflare free/cheap tiers preferred. AWS SES retained for email cost efficiency.
- **Auth**: Auth0 is the identity provider — no migration of user data, integrate with existing Auth0 tenant
- **Data**: ~1000 events in DynamoDB must be migrated to D1 without data loss
- **Platform**: Cloudflare Workers + D1 as primary compute and database platform
- **Tech stack**: TypeScript throughout — Hono API, React Router 7 events app, Astro website

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare over AWS | Cost reduction, simpler DX, D1 over DynamoDB | — Pending |
| Monorepo with pnpm | Shared config, coordinated changes, small team | — Pending |
| Auth0 retained | Already has user data, free for <100 members | — Pending |
| Astro + Tailwind for www | Static site doesn't need React/Mantine complexity | — Pending |
| Mantine for events app | Component library for consistent UI, already chosen | — Pending |
| Lefthook over Husky | Preferred git hook tool | — Pending |
| AWS SES for email | Cost-effective, already working — only AWS component retained | — Pending |

---
*Last updated: 2026-02-22 after initialization*
