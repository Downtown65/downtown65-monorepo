# Phase 2: Static Website - Research

**Researched:** 2026-03-15
**Domain:** Astro static site on Cloudflare Workers with Tailwind CSS
**Confidence:** HIGH

## Summary

Phase 2 converts the existing bare Cloudflare Worker placeholder at `apps/www` into a fully designed Astro static site. The site is a single landing page for Downtown 65 sports club, served via Cloudflare Workers static assets.

Astro 6.0.4 (released March 10, 2026) is the current stable version and supports Node.js 22+ (matching the project). For a purely static site, **no Cloudflare adapter is needed** -- Astro builds to `dist/` and wrangler deploys static assets directly. Tailwind CSS v4 integrates via the `@tailwindcss/vite` plugin (not the deprecated `@astrojs/tailwind` integration).

The existing monorepo infrastructure (CI/CD, biome, knip, TypeScript project references) remains intact. The main work is: install Astro + Tailwind, create the landing page with the specified design system (dark grid background, sticker aesthetic, pink accent), configure wrangler for static asset serving, and update tooling configs.

**Primary recommendation:** Use Astro 6 in static output mode (default) with Tailwind CSS v4 via `@tailwindcss/vite`, deploy via wrangler static assets -- no adapter, no SSR.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
| Decision | Detail |
|----------|--------|
| Page count | Single landing page |
| Language | Finnish only |
| Background | Dark with subtle grid pattern |
| Sticker effect | White border cutout on photos/elements |
| Hero style | Pixel/block text on dark grid |
| Board members | 7 people -- sticker photo, nickname, title |
| Color palette | CSS custom properties, primary: #eca0c5 + #000000 |
| Social media | Own section + footer |
| Footer content | Social icons (FB, IG) + hello@downtown65.com |
| Events app link | Deferred to Phase 5 |
| Domain | downtown65.site |

### Deferred Ideas (OUT OF SCOPE)
- Events app link/button in nav or hero (Phase 5)
- Bilingual content (not planned)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Static club information pages (Astro + Tailwind) | Astro 6 static output + Tailwind v4 via Vite plugin, deployed as Cloudflare Workers static assets |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.0.4 | Static site generator | Current stable, Node 22+, first-class Cloudflare support |
| tailwindcss | 4.x | Utility-first CSS | Project specifies Tailwind; v4 is current stable |
| @tailwindcss/vite | 4.x | Tailwind Vite integration | Official Vite plugin, replaces deprecated @astrojs/tailwind |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/check | latest | Astro-specific TypeScript checking | Replaces `tsc --noEmit` for `.astro` files |
| sharp | latest | Image optimization | Already in root onlyBuiltDependencies; Astro uses for image processing |

### Not Needed
| Library | Why Not |
|---------|---------|
| @astrojs/cloudflare | Only for SSR/server rendering; static sites deploy without adapter |
| @astrojs/tailwind | Deprecated for Tailwind v4; use @tailwindcss/vite directly |
| @astrojs/sitemap | Single page -- no sitemap needed |

**Installation (add to catalog in pnpm-workspace.yaml):**
```bash
pnpm --filter @dt65/www add astro tailwindcss @tailwindcss/vite @astrojs/check
```

**Catalog additions needed in pnpm-workspace.yaml:**
```yaml
astro: 6.0.4
tailwindcss: 4.1.8  # or latest 4.x
"@tailwindcss/vite": 4.1.8
"@astrojs/check": latest
```

## Architecture Patterns

### Recommended Project Structure
```
apps/www/
  astro.config.mjs          # Astro config with Tailwind vite plugin
  wrangler.jsonc             # Updated: static assets config
  tsconfig.json              # Updated: extends astro tsconfig
  package.json               # Updated: astro scripts
  public/
    favicon.svg              # Static assets served as-is
    images/                  # Board member photos, logo
      board/                 # 7 board member photos
      logo.svg               # Club logo
  src/
    styles/
      global.css             # CSS custom properties + @import "tailwindcss"
    layouts/
      BaseLayout.astro       # HTML shell, meta tags, global CSS import
    components/
      Hero.astro             # Pixel/block text hero section
      About.astro            # Club info section
      Membership.astro       # Membership info section
      BoardMembers.astro     # 7 member sticker cards
      SocialMedia.astro      # FB + IG links section
      Footer.astro           # Social icons + email
    pages/
      index.astro            # Single landing page, composes all sections
    data/
      board-members.ts       # Board member data (name, nickname, title, photo path)
      social-links.ts        # Social media URLs
```

### Pattern 1: Astro Static Output (Default)
**What:** Astro defaults to `output: 'static'` -- all pages pre-rendered at build time.
**When to use:** Always for this project (no SSR needed).
**Example:**
```typescript
// astro.config.mjs
// Source: https://docs.astro.build/en/reference/configuration-reference/
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // output: 'static' is the default -- no need to specify
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Pattern 2: Wrangler Static Assets (No Worker Code)
**What:** Deploy Astro's `dist/` as Cloudflare Workers static assets without any Worker entry point.
**When to use:** Static-only sites with no server logic.
**Example:**
```jsonc
// wrangler.jsonc
// Source: https://developers.cloudflare.com/workers/static-assets/
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "downtown65-www",
  "compatibility_date": "2026-02-01",
  "assets": {
    "directory": "./dist"
  },
  "env": {
    "production": {
      "name": "downtown65-www-production"
    }
  }
}
```
**Critical:** Remove the `"main"` field -- there is no Worker entry point for a pure static site. The `"assets"` field replaces it.

### Pattern 3: CSS Custom Properties + Tailwind v4
**What:** Define design tokens as CSS custom properties, reference in Tailwind.
**When to use:** Brand colors that need to be consistent and easily changeable.
**Example:**
```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary-pink: #eca0c5;
  --color-primary-black: #000000;
  --color-surface: #0a0a0a;
  --color-surface-grid: #1a1a1a;
  --color-sticker-border: #ffffff;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
}
```
In Tailwind v4, `@theme` directive registers custom values that become available as utilities (e.g., `bg-primary-pink`, `text-primary-black`).

### Pattern 4: Dark Grid Background (Pure CSS)
**What:** Subtle grid pattern on dark background using CSS linear gradients.
**When to use:** Hero and full-page background.
**Example:**
```css
/* Grid background pattern */
.grid-background {
  background-color: var(--color-surface);
  background-image:
    linear-gradient(var(--color-surface-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-surface-grid) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### Pattern 5: Sticker Cutout Effect (CSS)
**What:** White border cutout effect on images resembling stickers.
**When to use:** Board member photos and visual elements.
**Example:**
```css
.sticker {
  border: 4px solid var(--color-sticker-border);
  border-radius: 2px;
  box-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.3),
    -1px -1px 0 rgba(255, 255, 255, 0.1);
  transform: rotate(-2deg); /* slight tilt for sticker feel */
}
```

### Anti-Patterns to Avoid
- **Using @astrojs/cloudflare for static sites:** Causes build failures (GitHub issue #15650). Static sites need no adapter.
- **Using @astrojs/tailwind integration:** Deprecated for Tailwind v4. Use `@tailwindcss/vite` directly.
- **Keeping `"main"` in wrangler.jsonc:** A static-assets-only Worker must NOT have a `main` entry point. Remove it.
- **Using `@tailwind base; @tailwind components; @tailwind utilities;`:** This is Tailwind v3 syntax. Use `@import "tailwindcss";` for v4.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual resizing/compression | Astro `<Image />` component or `<img>` with pre-optimized assets | Astro handles srcset, format conversion, lazy loading |
| Grid background | Complex SVG patterns | CSS linear-gradient pattern | Two lines of CSS, perfect for subtle grid |
| Social media icons | Custom SVG sprites | Inline SVGs or simple icon components | Only 2-3 icons needed (FB, IG, email) |
| Responsive layout | Media query soup | Tailwind responsive prefixes (`md:`, `lg:`) | Consistent with project's utility-first approach |

**Key insight:** This is a single landing page. Keep it simple -- Astro components, Tailwind utilities, minimal custom CSS. No JavaScript frameworks, no client-side interactivity needed.

## Common Pitfalls

### Pitfall 1: Wrangler Config Conflict (main vs assets)
**What goes wrong:** Build/deploy fails because wrangler.jsonc has both `"main"` and `"assets"` fields, or only `"main"` with no static asset serving.
**Why it happens:** The existing www app has `"main": "src/index.ts"` for a bare Worker. Switching to Astro static assets requires removing `main` and adding `assets`.
**How to avoid:** Remove `"main"` field entirely. Add `"assets": { "directory": "./dist" }`. Remove the old `src/index.ts` Worker entry point.
**Warning signs:** Deploy succeeds but serves "dt65-www" text instead of the Astro site.

### Pitfall 2: Astro TypeScript Config Incompatibility
**What goes wrong:** TypeScript errors because Astro expects its own tsconfig setup that may conflict with the monorepo's `tsconfig.base.json`.
**Why it happens:** Astro uses `@astrojs/check` for `.astro` files and needs specific `jsxImportSource` and other settings.
**How to avoid:** Extend Astro's recommended tsconfig in the www app's tsconfig.json. May need to adjust `extends` to include both Astro and the monorepo base config. Test `pnpm typecheck` from root after changes.
**Warning signs:** Type errors on `.astro` files, or `astro check` passing but `tsc --build` failing.

### Pitfall 3: Knip False Positives with Astro
**What goes wrong:** Knip reports Astro dependencies or `.astro` files as unused.
**Why it happens:** Knip may not understand Astro's file conventions (pages/, layouts/, components/) without proper plugin configuration.
**How to avoid:** Knip has built-in Astro plugin support. Update the `apps/www` knip workspace config to use Astro entry patterns. Set `entry` to include `src/pages/**/*.astro` and `astro.config.mjs`.
**Warning signs:** `pnpm check` fails with "unused files" for Astro components.

### Pitfall 4: Build Script Must Run Astro Build Before Wrangler
**What goes wrong:** `wrangler deploy` finds empty or missing `dist/` directory.
**Why it happens:** The current `build` script is `wrangler deploy --dry-run`. Astro needs `astro build` to generate `dist/` first, then wrangler deploys the static assets.
**How to avoid:** Update build script to `astro build` for the build step. Update deploy to `astro build && wrangler deploy`. Or let CI handle build order.
**Warning signs:** Empty site after deploy, or wrangler error about missing assets directory.

### Pitfall 5: CI Deploy Needs Astro Build Step
**What goes wrong:** CI deploys the old bare Worker instead of the Astro site.
**Why it happens:** The deploy workflow uses `wrangler deploy` without first running `astro build`.
**How to avoid:** Add `preCommands: pnpm run build` to the wrangler-action for www in both deploy.yml and pr-checks.yml, where `build` script runs `astro build`.
**Warning signs:** Deployed site shows "dt65-www" text or 404.

### Pitfall 6: Biome and .astro Files
**What goes wrong:** Biome tries to lint `.astro` files and fails, or skips them entirely.
**Why it happens:** Biome has limited Astro support (can lint the script/TypeScript portions but not the template).
**How to avoid:** Biome handles `.astro` files in a limited way. The project's Biome config uses `includes: ["**"]` which will pick up `.astro` files. This should work for the TypeScript portions. Monitor for false errors.
**Warning signs:** Lint errors in `.astro` template syntax.

## Code Examples

### Astro Config with Tailwind v4
```typescript
// apps/www/astro.config.mjs
// Source: https://tailwindcss.com/docs/installation/framework-guides/astro
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Base Layout
```astro
---
// apps/www/src/layouts/BaseLayout.astro
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="fi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-primary-black text-text-primary">
    <slot />
  </body>
</html>
```

### Landing Page Composition
```astro
---
// apps/www/src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
import Membership from '../components/Membership.astro';
import BoardMembers from '../components/BoardMembers.astro';
import SocialMedia from '../components/SocialMedia.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout
  title="Downtown 65 Endurance ry"
  description="Downtown 65 Endurance ry - Urheiluseura"
>
  <Hero />
  <About />
  <Membership />
  <BoardMembers />
  <SocialMedia />
  <Footer />
</BaseLayout>
```

### Updated package.json Scripts
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "test": "vitest run --passWithNoTests",
    "lint": "biome lint",
    "format": "biome check --write",
    "ci:lint": "biome ci",
    "clean": "rimraf dist"
  }
}
```

### Updated wrangler.jsonc (Static Assets Only)
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "downtown65-www",
  "compatibility_date": "2026-02-01",
  "assets": {
    "directory": "./dist"
  },
  "env": {
    "production": {
      "name": "downtown65-www-production"
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @astrojs/tailwind | @tailwindcss/vite plugin | Astro 5.2+ / Tailwind v4 | Direct Vite plugin, simpler config |
| Cloudflare Pages | Cloudflare Workers static assets | 2025 | Single deployment model for all Workers |
| @astrojs/cloudflare for all sites | No adapter for static | Astro 6 | Static sites don't need adapter; adapter causes issues |
| Tailwind v3 `@tailwind` directives | Tailwind v4 `@import "tailwindcss"` | Tailwind v4 (2025) | New CSS-first config with @theme |
| Tailwind v3 `tailwind.config.js` | Tailwind v4 CSS `@theme` directive | Tailwind v4 (2025) | Config in CSS, not JS |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Deprecated for Tailwind v4 projects
- `@tailwind base/components/utilities`: Tailwind v3 syntax, use `@import "tailwindcss"` in v4
- `tailwind.config.js`: Replaced by `@theme` in CSS for v4
- Cloudflare Pages for new projects: Cloudflare recommends Workers for new deployments

## Open Questions

1. **Astro TypeScript integration with monorepo project references**
   - What we know: Astro has its own tsconfig expectations. The monorepo uses `tsc --build` with project references.
   - What's unclear: Whether `astro check` and `tsc --build` can coexist cleanly. Astro may need `astro/tsconfigs/strictest` as base.
   - Recommendation: During implementation, test both `astro check` and `tsc --build` from root. May need to exclude www from `tsc --build` and use `astro check` instead.

2. **Board member photos -- format and optimization**
   - What we know: User will provide photos. Astro has built-in image optimization via `<Image />`.
   - What's unclear: Whether photos are provided as PNG/JPG, what dimensions, whether sticker cutout effect is done in CSS or pre-processed.
   - Recommendation: Accept any format, use CSS for sticker effect (border + shadow + rotation), optimize with Astro Image or pre-optimize manually.

3. **Hero pixel/block text implementation**
   - What we know: "Downtown 65 Endurance ry" in pixel/block-style typography on dark grid.
   - What's unclear: Whether this is a custom font, SVG, CSS-styled text, or an image.
   - Recommendation: Use a blocky/pixel web font (e.g., Press Start 2P, VT323, or similar from Google Fonts) or create as SVG for exact control. CSS `letter-spacing` and `font-weight` can enhance block feel.

4. **Custom domain routing in wrangler**
   - What we know: Domain is `downtown65.site` with www redirect in Cloudflare.
   - What's unclear: Whether custom domain is configured in wrangler.jsonc routes or via Cloudflare dashboard.
   - Recommendation: Configure custom domain via Cloudflare dashboard (simpler, no wrangler config needed). Add `routes` to wrangler.jsonc production env if preferred as code.

## Sources

### Primary (HIGH confidence)
- [Astro Deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) - Static site deployment, no adapter needed
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) - Assets directory config, routing behavior
- [Tailwind CSS Astro Installation](https://tailwindcss.com/docs/installation/framework-guides/astro) - @tailwindcss/vite setup steps
- [Astro GitHub Releases](https://github.com/withastro/astro/releases) - v6.0.4 is latest stable (March 12, 2026)

### Secondary (MEDIUM confidence)
- [Astro + Cloudflare static issue #15650](https://github.com/withastro/astro/issues/15650) - Confirms no adapter for static output
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) - Route configuration options
- [CSS Grid Backgrounds with Tailwind](https://ibelick.com/blog/create-grid-and-dot-backgrounds-with-css-tailwind-css) - Grid pattern implementation

### Tertiary (LOW confidence)
- Astro 6 + pnpm monorepo TypeScript integration specifics (needs hands-on validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs confirm Astro 6 + Tailwind v4 + Workers static assets approach
- Architecture: HIGH - Single landing page is straightforward Astro use case
- Pitfalls: HIGH - Verified wrangler config conflicts and adapter issues via official sources and GitHub issues
- Design implementation: MEDIUM - Grid background and sticker effects are standard CSS patterns but exact rendering needs iteration

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (Astro 6 is stable, unlikely to change significantly)
