import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

// Varlock's patch modules use node:http which isn't available in Workers.
// Stub them out since resolved-env mode doesn't need runtime patching.
const noopPatches = path.resolve(import.meta.dirname, 'src/varlock-noop-patches.ts');

async function loadVarlockPlugin(): Promise<Plugin | undefined> {
  try {
    const { varlockVitePlugin } = await import('@varlock/vite-integration');
    return varlockVitePlugin();
  } catch {
    // Varlock requires credentials to initialize. Skip in CI/knip.
    return undefined;
  }
}

export default defineConfig(async () => {
  const varlock = await loadVarlockPlugin();

  return {
    plugins: [varlock, cloudflare()],
    resolve: {
      alias: {
        'varlock/patch-console': noopPatches,
        'varlock/patch-server-response': noopPatches,
        'varlock/patch-response': noopPatches,
      },
    },
  };
});
