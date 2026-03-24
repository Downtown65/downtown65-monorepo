import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../apps/api/openapi.json',
  output: {
    path: 'src/generated',
    format: 'biome',
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/sdk'],
});
