import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { varlockCloudflareVitePlugin } from '@varlock/cloudflare-integration';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

// async function loadVarlockPlugins(): Promise<Plugin[]> {
//   try {
//     const { varlockCloudflareVitePlugin } = await import('@varlock/cloudflare-integration');
//     return varlockCloudflareVitePlugin({
//       inspectorPort: 9231,
//       viteEnvironment: { name: 'ssr' },
//     });
//   } catch (error) {
//     // biome-ignore lint/suspicious/noConsole: build-time diagnostic
//     console.warn('[varlock] Plugin failed to initialize, env will NOT be injected into bundle');
//     // biome-ignore lint/suspicious/noConsole: build-time diagnostic
//     console.warn('[varlock]', error instanceof Error ? error.message : error);
//     return [];
//   }
// }

export default defineConfig(async () => {
  // const varlockPlugins = await loadVarlockPlugins();

  return {
    plugins: [
      varlockCloudflareVitePlugin({
        inspectorPort: 9231,
        viteEnvironment: { name: 'ssr' },
      }),
      reactRouter(),
    ],
    resolve: {
      alias: {
        '~': path.resolve(import.meta.dirname, 'app'),
      },
    },
  };
});
