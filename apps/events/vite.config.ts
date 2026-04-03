import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

// @cloudflare/vite-plugin uses a virtual entry so varlock's entry detection fails.
// This plugin injects initVarlockEnv() into the worker entry ourselves.
//
// Cannot use @varlock/cloudflare-integration (which wraps this fix) because it
// runs initVarlockEnv() at module scope, crashing knip and any other tool that
// loads vite.config.ts outside of `varlock run`. Tracked upstream — recheck when
// @varlock/cloudflare-integration >0.0.1 is released.
async function loadVarlockPlugins(): Promise<Plugin[]> {
  try {
    const { varlockVitePlugin } = await import('@varlock/vite-integration');
    const plugin = varlockVitePlugin();

    const workerEntryPatch: Plugin = {
      name: 'varlock-worker-entry-patch',
      enforce: 'post',
      transform(code, id, options) {
        if (!options?.ssr) return null;
        if (!id.includes('workers/app.ts')) return null;

        const loadedEnv = process.env.__VARLOCK_ENV;
        if (!loadedEnv) {
          // biome-ignore lint/suspicious/noConsole: build-time diagnostic
          console.warn(
            '[varlock] __VARLOCK_ENV is empty — skipping env injection into worker entry',
          );
          return null;
        }

        const initCode = [
          '// INJECTED BY varlock-worker-entry-patch',
          'globalThis.__varlockThrowOnMissingKeys = true;',
          `globalThis.__varlockLoadedEnv = ${loadedEnv};`,
          "import { initVarlockEnv } from 'varlock/env';",
          'initVarlockEnv();',
        ].join('\n');

        return { code: `${initCode}\n${code}`, map: null };
      },
    };

    return [plugin, workerEntryPatch];
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: build-time diagnostic
    console.warn('[varlock] Plugin failed to initialize, env will NOT be injected into bundle');
    // biome-ignore lint/suspicious/noConsole: build-time diagnostic
    console.warn('[varlock]', error instanceof Error ? error.message : error);
    return [];
  }
}

export default defineConfig(async () => {
  const varlockPlugins = await loadVarlockPlugins();

  return {
    plugins: [
      ...varlockPlugins,
      cloudflare({ inspectorPort: 9231, viteEnvironment: { name: 'ssr' } }),
      reactRouter(),
    ],
    resolve: {
      alias: {
        '~': path.resolve(import.meta.dirname, 'app'),
      },
    },
  };
});
