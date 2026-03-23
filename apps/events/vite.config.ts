import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

async function loadVarlockPlugins(): Promise<Plugin[]> {
  try {
    const { varlockVitePlugin } = await import('@varlock/vite-integration');
    const plugin = varlockVitePlugin();

    // TODO: Remove after @varlock/vite-integration >0.2.5 — fixed upstream:
    // https://github.com/dmno-dev/varlock/blob/main/packages/integrations/vite/src/index.ts
    // @cloudflare/vite-plugin uses a virtual entry so varlock's entry detection fails.
    // This plugin injects initVarlockEnv() into the worker entry ourselves.
    const workerEntryPatch: Plugin = {
      name: 'varlock-worker-entry-patch',
      enforce: 'post',
      transform(code, id, options) {
        if (!options?.ssr) return null;
        if (!id.includes('workers/app.ts')) return null;

        const loadedEnv = process.env.__VARLOCK_ENV;
        if (!loadedEnv) return null;

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
  } catch {
    // Varlock requires credentials to initialize. Skip in CI/knip.
    return [];
  }
}

export default defineConfig(async () => {
  const varlockPlugins = await loadVarlockPlugins();

  return {
    plugins: [...varlockPlugins, cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter()],
    resolve: {
      alias: {
        '~': path.resolve(import.meta.dirname, 'app'),
      },
    },
  };
});
