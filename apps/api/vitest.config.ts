import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [cloudflare()],
  test: {
    passWithNoTests: true,
  },
});
