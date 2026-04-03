import path from 'node:path';
import { varlockCloudflareVitePlugin } from '@varlock/cloudflare-integration';
import { defineConfig } from 'vite';

// async function loadVarlockPlugins(): Promise<Plugin[]> {
//   try {
//     const { varlockCloudflareVitePlugin } = await import('@varlock/cloudflare-integration');
//     return varlockCloudflareVitePlugin({ inspectorPort: 9230 });
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
    plugins: [varlockCloudflareVitePlugin({ inspectorPort: 9230 })],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
  };
});
