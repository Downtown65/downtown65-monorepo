# Scope: Admin Panel

## Goal
Admins and board members can view and manage club members, track membership fee payments, and browse all events through a dedicated admin application.

## Requirements
- ADMN-V2-01: Admin can view and manage member accounts (activate/deactivate, change role)
- ADMN-V2-03: Admin can track yearly membership fee payment status per member
- ADMN-V2-02: Admin can view all events in a paginated table (read-only)

## Key Decisions
- **Separate app** (`apps/admin`) — React Router 7 + Mantine on Cloudflare Workers, same stack as events app
- **Auth0 is source of truth for roles** — three roles: `admin`, `board_member`, `member`
- **Access control** — only `admin` and `board_member` roles can access the admin panel
- **Auth0 roles & permissions** not yet activated — setup required as part of this epic
- **Existing API (`apps/api`) extended** with admin endpoints — no separate admin API
- **Fee tracking** — simple paid/unpaid toggle per member per calendar year
- **Fee & role caching storage TBD** — Auth0 user_metadata vs KV vs D1 needs a design spike to minimize duplication while keeping Auth0 as role source of truth
- **Last admin safeguard** — system must prevent removing the last admin role
- **Events view** — read-only paginated table showing all events (past + upcoming) with title, date, type, creator, participant count
- **User management view** — shows nickname, name, email, role, active/inactive status, fee payment status, join date, last login
- **Self-signup only** — admins cannot create member accounts
- **Finnish UI** — consistent with events app

## Out of Scope
- Event modification by admin (ADMN-V2-02 edit/delete — deferred, only read-only view for now)
- `spinning_admin` role — deferred, needs further design
- Custom Auth0 branding for admin login
- Audit logging of admin actions
- Bulk operations (batch activate/deactivate)

## Technical Approach
- **React Router 7** in framework mode with SSR, deployed as Cloudflare Worker
- **Auth0 Universal Login** — same redirect flow as events app, but role-gated on callback
- **Admin API endpoints** added to existing `apps/api` — protected by role-based middleware that checks Auth0 JWT claims for `admin` or `board_member` role
- **Auth0 Management API** — called server-side for role changes and user metadata operations
- **Mantine v7** for all UI components — DataTable for users and events lists with pagination
- **Design spike needed** before implementation: resolve where fee payment data and cached roles live (Auth0 user_metadata, Cloudflare KV, or D1 table)
