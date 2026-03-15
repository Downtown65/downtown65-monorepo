# Phase 2: Static Website — Implementation Context

## Pages & Content

**Single landing page** — no multi-page routing needed.

Sections (top to bottom):
1. **Hero** — "Downtown 65 Endurance ry" in pixel/block-style typography on dark grid background
2. **About / Club info** — brief description of what DT65 is (Finnish text)
3. **Membership info** — short description of membership (no detailed fees/requirements)
4. **Board members** — 7 members, each displayed as a sticker-style card with: photo (sticker cutout effect), nickname, title
5. **Social media** — dedicated section with Facebook and Instagram links
6. **Footer** — social media icons + club email (`hello@downtown65.com`)

**Language:** All content in Finnish.
**Audience:** General public — the site communicates "we exist" rather than serving members.

## Visual Identity

**Overall feel:** Clean and minimal.
**Reference site:** untappedafrica.co.za — for layout feel and scroll behavior.

**Design system:**
- **Dark background** with subtle grid pattern (dark squares/lines on black)
- **Sticker aesthetic** — photos and visual elements have a white border cutout effect, scattered/placed on the grid
- **Hero text** — pixel/block-style rendering of "Downtown 65 Endurance ry" on the dark grid (similar to the provided reference image)
- **Board member photos** — sticker cutout style with white border, placed on the grid background

**Color palette (CSS custom properties in `global.css`):**
- Primary pink: `#eca0c5`
- Primary black: `#000000`
- Additional complementary colors to be derived (grays, white for sticker borders, etc.)
- All colors defined as CSS custom properties (`--color-*`) for easy swapping

**Brand assets:** User will provide logo, photos, and any other visual assets.

## Events App Integration

- **Domain:** `downtown65.site` (www redirect configured in Cloudflare)
- **Events app link:** NOT included in Phase 2 — will be added in Phase 5 when the events app is deployed
- **No shared UI components** between www and events app — they are visually independent

## Deferred Ideas

- Events app link/button in nav or hero (Phase 5)
- Bilingual content (not planned)

## Decisions Summary

| Decision | Detail |
|----------|--------|
| Page count | Single landing page |
| Language | Finnish only |
| Background | Dark with subtle grid pattern |
| Sticker effect | White border cutout on photos/elements |
| Hero style | Pixel/block text on dark grid |
| Board members | 7 people — sticker photo, nickname, title |
| Color palette | CSS custom properties, primary: #eca0c5 + #000000 |
| Social media | Own section + footer |
| Footer content | Social icons (FB, IG) + hello@downtown65.com |
| Events app link | Deferred to Phase 5 |
| Domain | downtown65.site |
