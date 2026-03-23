# Scope: Events Application

## Goal
Members can log in, browse upcoming events, create/edit events via a wizard, and join/leave events through a mobile-responsive React Router 7 SSR app on Cloudflare Workers.

## Requirements
- AUTH-01: Login via Auth0 Universal Login, session persists across refresh
- AUTH-02: Logout from any page
- AUTH-03: Password reset via Auth0 Universal Login
- AUTH-04: Signup with email, nickname, name, password, registerSecret
- AUTH-05: Signup guarded by registerSecret
- AUTH-06: Participants displayed by nickname
- INFR-08: React Router 7 + Mantine + Tabler Icons
- INFR-09: Mobile-responsive UI
- EVNT-04: Join an event (UI)
- EVNT-05: Leave an event (UI)

## Key Decisions
- **Auth0 Universal Login** instead of Lock (Lock is deprecated). Default Auth0 hosted page, no custom branding for v1
- **"Remember me" option** — 6-month session via Auth0 refresh token rotation. App uses refresh tokens to keep access tokens alive silently
- **SSR** via React Router 7 on Cloudflare Workers
- **Mantine v7** (latest) with Tabler Icons
- **Light/dark theme** — Mantine color scheme toggle, persisted in cookie
- **Rich text editor** using @mantine/tiptap for event descriptions
- **6-step event creation wizard** matching existing app: event type → title → date → time → description → preview
- Location, subtitle, race fields included but not as separate wizard steps
- **Mobile-first, fully responsive** — designed for phone screens first, scales up to tablet and desktop
- **Custom 404 page** — styled error page matching the app design
- **Event list** shows upcoming events only (responsive grid: 1 col mobile, 2 col tablet, 3 col desktop)
- **Join/leave** toggle button on event detail, participant list with nickname badges, current user highlighted
- **Owner-only edit/delete** — buttons hidden for non-owners, explanatory text shown
- **Finnish UI** throughout (matching existing app)
- **API key** passed from events app to API via server-side calls (not exposed to client)

## Out of Scope
- PWA (manifest, install prompt, offline) — deferred to v2
- Members page — deferred
- Profile page — deferred
- Event filtering — deferred (EVNT-V2-01)
- Past events listing — deferred
- Custom Auth0 login page branding — deferred

## Technical Approach
- **React Router 7** in framework mode with SSR, deployed as Cloudflare Worker
- **Auth0 Universal Login** — redirect flow with PKCE. Auth state managed server-side via session cookie. Refresh token rotation for long-lived sessions (6 months)
- **API communication** — server-side loaders/actions call the Hono API with x-api-key + JWT Bearer token
- **Mantine v7** for all UI components, CSS modules for custom styling
- **@mantine/tiptap** for rich text editing in event creation/edit
- **Event wizard** — useReducer for multi-step form state, step validation before advancing
- **Responsive layout** — Mantine AppShell with burger menu on mobile
- **Date handling** — Mantine DatePicker with Finnish locale (d.M.yyyy format)
