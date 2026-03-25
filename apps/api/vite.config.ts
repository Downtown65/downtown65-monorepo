import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

async function loadVarlockPlugins(): Promise<Plugin[]> {
  try {
    const { varlockVitePlugin } = await import('@varlock/vite-integration');
    const plugin = varlockVitePlugin();

    // TODO: Remove after @varlock/vite-integration >0.2.5 — fixed upstream:
    // https://github.com/dmno-dev/varlock/blob/main/packages/integrations/vite/src/index.ts
    // @cloudflare/vite-plugin uses a virtual entry (virtual:cloudflare/worker-entry)
    // so varlock's entry detection (moduleIds[0] === id) never matches src/index.ts.
    // This plugin injects initVarlockEnv() into the worker entry ourselves.
    const workerEntryPatch: Plugin = {
      name: 'varlock-worker-entry-patch',
      enforce: 'post',
      transform(code, id, options) {
        if (!options?.ssr) return null;
        if (!id.includes('apps/api/src/index.ts')) return null;

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
    plugins: [...varlockPlugins, cloudflare({ inspectorPort: 9230 })],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
  };
});
