# Environment Variables (VarLock)

All environment variables are managed by [VarLock](https://varlock.dev). The `.env.schema` in each app is the single source of truth.

## How it works

- **Schema:** `.env.schema` defines all vars with types, sensitivity, and defaults
- **Env files:** `.env.local`, `.env.preview`, `.env.production` provide values per environment
- **Secrets:** Sensitive values fetched from Infisical via `infisical()` in `.env.schema`
- **Types:** VarLock auto-generates `env.d.ts` with typed `CoercedEnvSchema`

## Accessing env vars in code

Use VarLock's `ENV` object -- never `process.env`, `import.meta.env`, or `c.env` for config values:

```ts
import { ENV } from 'varlock/env';

// Correct
const apiKey = ENV.X_API_KEY;

// Wrong -- do not use for VarLock-managed vars
const apiKey = c.env.X_API_KEY;        // Worker binding
const apiKey = import.meta.env.X_API_KEY; // Vite env
```

VarLock's Vite plugin inlines `ENV.*` values at build time. In production, the deployed Worker has values baked in -- no runtime env access needed.

## Cloudflare Worker bindings vs VarLock

Only native Cloudflare bindings (D1, KV, R2, etc.) belong in `wrangler.jsonc`. All string config goes in `.env.schema`:

```
wrangler.jsonc  → DB (D1 binding only)
.env.schema     → X_API_KEY, AUTH0_DOMAIN, AUTH0_AUDIENCE, APP_ENV, etc.
```

The `Bindings` type in `app.ts` should only contain native bindings:

```ts
export type Bindings = {
  DB: D1Database;
};
```

## Testing with VarLock

Tests run in `@cloudflare/vitest-pool-workers` (miniflare), which cannot initialize VarLock at runtime. The workaround is aliasing `varlock/env` to a test mock in `vitest.config.ts`:

```ts
resolve: {
  alias: {
    'varlock/env': path.resolve(import.meta.dirname, 'src/__tests__/varlock-env-mock.ts'),
  },
},
```

The mock (`src/__tests__/varlock-env-mock.ts`) exports a plain `ENV` object with test values. This way, both app code and test code use `ENV.*` consistently.
