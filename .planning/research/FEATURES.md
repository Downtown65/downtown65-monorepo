# Feature Research

**Domain:** Sports club event management (small club, ~100 members)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. For DT65, the existing AWS system already provides many of these, so members will expect at minimum feature parity.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Event CRUD (create, read, update, delete) | Core product value. Members create events with type, date, time, location, title, subtitle, description, race flag. Exists in current system. | MEDIUM | 15 event types (cycling, running, skiing, swimming, triathlon, etc.). Must support Finnish-language content. Schema design matters — get field set right early. |
| Event participation (join/leave) | The heartbeat of the club. One-tap join/leave is the primary user action. Exists in current system. | LOW | Must be instant and reliable. Optimistic UI updates recommended. Show participant list on event. |
| Event listing with upcoming events | Members need to see what's coming up. Feed/calendar view of upcoming events is the landing page experience. | LOW | Sort by date. Filter by event type is nice-to-have but not critical for ~100 members. |
| Authentication (login/logout) | Members must identify themselves to create events and join. Auth0 already hosts user data. | MEDIUM | Auth0 integration with PKCE flow for SPA. Token refresh, session management. Existing Auth0 tenant means no user migration needed. |
| Member identity display | Participants shown by name on events. Members need to see who's coming. | LOW | Pull display name/avatar from Auth0 user profile. |
| Mobile-responsive UI | Most event interactions happen on phones (checking events on the go, RSVPing quickly). | MEDIUM | PWA with Mantine component library handles responsive layout. Must work well on mobile Safari and Chrome. |
| Email notification — new event created | Members want to know when a new event is posted so they don't miss it. Exists in current system. | MEDIUM | AWS SES integration. Must respect email preferences (opt-in/out). Triggered by event creation. |
| Email preferences (opt-in/out) | Members must control their notification volume. GDPR compliance for Finnish users. | LOW | Simple toggle per notification type stored in D1. Unsubscribe link in every email. |
| Reliable data persistence | Events and participation data must never be lost. Trust in the system depends on this. | MEDIUM | D1 with proper schema, transactions for participation changes, data migration from DynamoDB (~1000 events). |

### Differentiators (Competitive Advantage)

Features that set DT65 apart from generic tools like Spond, TeamSnap, or WhatsApp groups. Not expected, but valued. These are what make a custom-built solution worth maintaining over using an off-the-shelf app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| External participant access (spinning events) | The club runs weekly spinning classes with non-members. A lightweight account lets external participants see and join specific events without full membership. No competitor handles this niche well — most require full accounts for everyone. | HIGH | Requires separate auth flow or role-based access. External users should see only events they're invited to (e.g., spinning). Auth0 roles/permissions or separate lightweight token system. This is the most architecturally complex differentiator. |
| Weekly email digest (Monday morning) | Consolidated view of the upcoming week's events delivered to inbox. Reduces the need to check the app daily. Spond has push notifications but not curated weekly digests. Exists in current system. | MEDIUM | Scheduled Cloudflare Workers cron job or external trigger. Template rendering for event summaries. Personalization (show only event types the member cares about) is a future enhancement. |
| PWA with add-to-home-screen | App-like experience without app store friction. Members install directly from browser. No download required, no app store approval, instant updates. Competitors like Spond require native app downloads. | MEDIUM | Service worker for offline shell, web app manifest, install prompt. Offline capability limited to app shell — event data requires network. iOS install experience requires custom guidance banner. |
| Custom event types with icons | 15 specific Finnish sport types with recognizable icons (hiihto, pyorayily, uinti, etc.). Generic tools like Spond offer only basic category tags. | LOW | Static mapping of event type to icon/color. Makes event listings scannable at a glance. Finnish-language labels important. |
| Purpose-built for DT65 culture | No generic features bloating the UI. The app does exactly what DT65 needs: create events, join events, get notified. Clean, fast, focused. Generic platforms have payment processing, facility booking, and other features that add noise for a 100-person club. | LOW | This is an architectural decision more than a feature. Keep the UI minimal. Resist feature creep. The value is in simplicity and speed, not feature count. |
| Race event flag | Events can be flagged as competitive races vs casual activities. Members can quickly identify training vs competition events. | LOW | Boolean flag on event. Visual indicator in event listing (badge, icon, color). Simple but meaningful for the DT65 use case. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Native mobile apps (iOS/Android) | "Everyone has an app." App store presence feels professional. | Doubles or triples frontend development and maintenance cost. For ~100 members, app store discovery is irrelevant — members get the link directly. Apple/Google review processes add deployment friction. PWA covers the use case. | PWA with add-to-home-screen. Custom iOS install guidance banner. |
| Real-time updates (WebSockets) | "See participation changes live." | Adds significant infrastructure complexity (WebSocket connections, state sync). For an RSVP workflow with ~100 members, polling or page refresh is sufficient. Events don't change frequently enough to justify real-time. Cloudflare Workers doesn't natively support persistent WebSockets in the same way as dedicated servers. | Optimistic UI on join/leave actions. Simple refetch on page focus. Stale-while-revalidate caching pattern. |
| Payment processing | "Collect event fees, membership dues." | Massive compliance scope (PCI DSS, payment regulations). The club handles finances separately and is happy with that. Payment adds legal liability and support burden. | Link to external payment (MobilePay, bank transfer) in event description if needed. Keep finances out of the app. |
| In-app chat/messaging | "Let members discuss events." | Competes with WhatsApp/Telegram groups the club already uses. Chat requires moderation, notification management, message storage. High maintenance, low adoption when existing tools work. | Link to club's existing WhatsApp/Telegram group. Event description field for coordination notes. |
| OAuth social login (Google, Facebook) | "Easier login, more options." | Auth0 email/password is sufficient for ~100 known members. Social login adds OAuth configuration complexity, consent screens, and provider-specific edge cases. Members already have Auth0 accounts. | Keep Auth0 email/password. Password reset flow for lockouts. |
| Event capacity limits and waitlists | "Prevent overcrowding." | Adds significant UX complexity (waitlist management, automatic promotions, notification chains). For a casual sports club, social coordination handles capacity. The club hasn't needed this in the existing system. | If an event is full, the organizer edits the description to say so. Or creates a second event. |
| Content management system | "Let admins edit website pages." | CMS adds a whole category of infrastructure (editor UI, content storage, versioning, permissions). The static website content changes rarely. | Astro pages edited in code and deployed via CI. Developers in the club handle the rare content update. |
| Advanced search and filtering | "Search events by keyword, filter by type, date range, location." | Over-engineering for ~100 members and ~20 events per month. The event list is short enough to scan visually. | Simple chronological list of upcoming events. Optionally filter by event type if the list grows long. |
| User profile editing in-app | "Let members update their profile photo, bio, preferences in the app." | Auth0 already manages user profiles. Duplicating profile management creates sync issues and doubles the UX surface. | Link to Auth0 profile management for name/email changes. Only app-specific preferences (email opt-in/out) stored locally. |
| Multi-language support (Finnish + English) | "Some members might prefer English." | Internationalization adds complexity to every string in the app. The club operates in Finnish. Event content is written in Finnish. | Finnish-only UI. If truly needed later, add i18n to the component library in a future phase. |

## Feature Dependencies

```
[Auth0 Authentication]
    └──requires──> [Member Identity Display]
    └──requires──> [Event CRUD]
                       └──requires──> [Event Participation]
                       └──requires──> [Email: New Event Notification]
                                          └──requires──> [Email Preferences]
                       └──requires──> [Weekly Email Digest]

[Auth0 Authentication]
    └──requires──> [External Participant Access]
                       └──requires──> [Event Participation] (scoped)

[Event CRUD]
    └──requires──> [Event Listing]

[Mobile-Responsive UI]
    └──enhances──> [PWA Add-to-Home-Screen]

[Data Migration (DynamoDB → D1)]
    └──required-before──> [Event Listing] (needs data to display)
```

### Dependency Notes

- **Auth0 Authentication is the foundation:** Every feature that identifies a user depends on Auth0 working first. This must be the first integration built.
- **Event CRUD before participation:** You can't join an event that doesn't exist. Event creation is prerequisite for the join/leave flow.
- **Event CRUD before email notifications:** Notifications are triggered by event creation. The event system must exist before notification hooks.
- **Email preferences before sending emails:** To comply with GDPR and user expectations, preferences must be checkable before any email is sent. Default to opted-in with easy opt-out.
- **External participant access depends on Auth0:** The external user role/permission model is an extension of the auth system. It needs careful design to avoid polluting the member experience.
- **Data migration before launch:** Existing ~1000 events must be in D1 before the new system goes live. Members expect their event history.
- **PWA enhances but doesn't block:** The app works as a regular responsive web app first. PWA features (install prompt, offline shell) are progressive enhancements added after core functionality works.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to replace the existing AWS system without regression.

- [ ] Auth0 authentication (login/logout/session) — everything else depends on this
- [ ] Event CRUD with all 15 event types — core product value
- [ ] Event participation (join/leave) — the heartbeat of the club
- [ ] Event listing (upcoming events, chronological) — members need to find events
- [ ] Member identity on events (who's participating) — social proof drives participation
- [ ] Mobile-responsive UI — most usage is on phones
- [ ] Data migration from DynamoDB to D1 — can't launch without existing data
- [ ] New event email notification — members expect to be notified
- [ ] Email preferences (opt-in/out) — GDPR requirement, user trust

### Add After Validation (v1.x)

Features to add once core is working and members are using the new system.

- [ ] Weekly Monday email digest — adds value but not critical for day-one migration
- [ ] External participant access (spinning events) — complex auth, can run spinning signups manually initially
- [ ] PWA install prompt and add-to-home-screen — progressive enhancement after web app is stable
- [ ] Race event flag — simple addition once event schema is stable
- [ ] Service worker offline shell — improves perceived performance after core is solid

### Future Consideration (v2+)

Features to defer until the migration is stable and members have adapted.

- [ ] Event type filtering on listing page — only if event volume grows
- [ ] Push notifications (via service worker) — only if email notifications prove insufficient
- [ ] Event comments/notes — only if members request coordination features
- [ ] Event history/archive view — nice for nostalgia, not critical
- [ ] Member activity stats (events attended) — gamification, low priority

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth0 authentication | HIGH | MEDIUM | P1 |
| Event CRUD | HIGH | MEDIUM | P1 |
| Event participation (join/leave) | HIGH | LOW | P1 |
| Event listing (upcoming) | HIGH | LOW | P1 |
| Member identity display | HIGH | LOW | P1 |
| Mobile-responsive UI | HIGH | MEDIUM | P1 |
| Data migration (DynamoDB → D1) | HIGH | MEDIUM | P1 |
| New event email notification | MEDIUM | MEDIUM | P1 |
| Email preferences | MEDIUM | LOW | P1 |
| Weekly email digest | MEDIUM | MEDIUM | P2 |
| External participant access | MEDIUM | HIGH | P2 |
| PWA add-to-home-screen | MEDIUM | MEDIUM | P2 |
| Race event flag | LOW | LOW | P2 |
| Service worker offline shell | LOW | MEDIUM | P2 |
| Event type filtering | LOW | LOW | P3 |
| Push notifications | LOW | MEDIUM | P3 |
| Event comments | LOW | MEDIUM | P3 |
| Event history/archive | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (replace existing system without regression)
- P2: Should have, add after migration is stable
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Spond | TeamSnap | Heja | DT65 Approach |
|---------|-------|----------|------|---------------|
| Event creation | Full-featured with recurring events, capacity limits, waitlists | Schedule games/practices with RSVP | Create practices, games, events | Simple event creation with 15 sport types, no recurring events needed initially |
| RSVP/participation | One-tap RSVP, auto-accept option, waitlists when full | Availability tracking, requires upgrade for full features | RSVP with comments | One-tap join/leave, no waitlists, participant list visible |
| Authentication | Spond account (email/phone) | TeamSnap account | Heja account | Auth0 (existing tenant, email/password) |
| External/guest access | Invite by link, requires Spond account | Limited guest features | Parents can join team | Lightweight accounts for spinning class externals, scoped access |
| Notifications | Push notifications, in-app | Push, email (premium) | Push, in-app reminders | Email only (new event + weekly digest). No push initially. |
| Email digest | Not a curated weekly digest | Premium feature | Not available | Monday morning weekly digest of upcoming events |
| Mobile experience | Native iOS/Android app | Native iOS/Android app | Native iOS/Android app | PWA — no app store, installable from browser |
| Payment processing | Built-in for fees, events | Built-in (premium) | Not available | Deliberately excluded — club handles finances separately |
| Chat/messaging | Group chat per team | Team messaging | Team chat | Not built — club uses WhatsApp/Telegram |
| Cost | Free core, paid add-ons | Free basic, $9.99+/month premium | Free | Free (self-hosted on Cloudflare free tier) |
| Customization | Limited to Spond's UI/features | Limited | Limited | Fully custom, purpose-built for DT65 |

## Sources

- [Waresport: Top 10 Sports Club Management Software 2026](https://www.waresport.com/blog/top-10-sports-club-management-software-all-in-one-2026)
- [JoinIt: 15 Best Club Management Software Tools for 2026](https://joinit.com/blog/best-club-management-software)
- [ClubZap: Sports Club Management Software 2025 Ultimate Guide](https://clubzap.com/blog/the-ultimate-guide-to-sports-club-management-software/)
- [Spond: Planning Events](https://www.spond.com/planning-events/)
- [Spond: Best Free Club App](https://www.spond.com/news-and-blog/spond-best-free-club-app-your-sports/)
- [Spond vs TeamSnap vs SportsEngine](https://www.spond.com/news-and-blog/spond-vs-teamsnap-vs-sportsengine/)
- [Jersey Watch: 9 Best TeamSnap Alternatives 2025](https://www.jerseywatch.com/blog/teamsnap-alternatives)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Installation Prompt](https://web.dev/learn/pwa/installation-prompt)
- [Brainhub: PWA on iOS Limitations 2025](https://brainhub.eu/library/pwa-on-ios)
- [Auth0: Organizations and Member Management](https://auth0.com/docs/manage-users/organizations/configure-organizations/assign-members)
- [Stripo: Email Digest Best Practices](https://stripo.email/blog/design-newsletter-blog/)
- [Capterra: Best Sports League Software 2026](https://www.capterra.com/sports-league-software/)

---
*Feature research for: Sports club event management (DT65, ~100 members)*
*Researched: 2026-02-22*
