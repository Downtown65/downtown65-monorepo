import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig(async () => {
  const migrationsPath = path.resolve(import.meta.dirname, 'drizzle');
  const migrations = await readD1Migrations(migrationsPath);

  return {
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    test: {
      setupFiles: ['./src/__tests__/setup.ts'],
      poolOptions: {
        workers: {
          wrangler: {
            configPath: './wrangler.jsonc',
          },
          miniflare: {
            bindings: {
              TEST_MIGRATIONS: migrations,
              X_API_KEY: 'test-api-key',
              AUTH0_DOMAIN: 'test.auth0.com',
              AUTH0_AUDIENCE: 'https://test-audience',
            },
          },
        },
      },
    },
  };
});
