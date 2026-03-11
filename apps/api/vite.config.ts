import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import { varlockVitePlugin } from '@varlock/vite-integration';
import { defineConfig } from 'vite';

// Varlock's patch modules use node:http which isn't available in Workers.
// Stub them out since resolved-env mode doesn't need runtime patching.
const noopPatches = path.resolve(import.meta.dirname, 'src/varlock-noop-patches.ts');

export default defineConfig({
  plugins: [varlockVitePlugin(), cloudflare()],
  resolve: {
    alias: {
      'varlock/patch-console': noopPatches,
      'varlock/patch-server-response': noopPatches,
      'varlock/patch-response': noopPatches,
    },
  },
});
