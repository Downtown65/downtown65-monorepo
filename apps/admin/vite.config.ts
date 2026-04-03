import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

async function loadVarlockPlugins(): Promise<Plugin[]> {
  try {
    const { varlockCloudflareVitePlugin } = await import('@varlock/cloudflare-integration');
    return varlockCloudflareVitePlugin({
      inspectorPort: 9232,
      viteEnvironment: { name: 'ssr' },
    });
  } catch {
    // Varlock requires credentials to initialize. Skip in CI/knip.
    return [];
  }
}

export default defineConfig(async () => {
  const varlockPlugins = await loadVarlockPlugins();

  return {
    plugins: [...varlockPlugins, reactRouter()],
    resolve: {
      alias: {
        '~': path.resolve(import.meta.dirname, 'app'),
      },
    },
  };
});
