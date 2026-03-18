import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig(async () => {
  const migrationsPath = path.resolve(import.meta.dirname, 'drizzle');
  const migrations = await readD1Migrations(migrationsPath);

  return {
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        'varlock/env': path.resolve(import.meta.dirname, 'src/__tests__/varlock-env-mock.ts'),
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
            },
          },
        },
      },
    },
  };
});
