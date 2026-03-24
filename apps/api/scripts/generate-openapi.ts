import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApiApp } from '../src/create-app';
import type { AuthenticationService } from '../src/services/authentication-service';

// Stub service — only route definitions matter for OpenAPI spec generation
const stubAuth: AuthenticationService = {
  verifyToken: () => Promise.resolve({ sub: '', role: undefined }),
};

const app = createApiApp(stubAuth);

const spec = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'DT65 API', version: '1.0.0' },
  security: [{ apiKey: [] }],
});

const outPath = resolve(import.meta.dirname, '..', 'openapi.json');
writeFileSync(outPath, JSON.stringify(spec, null, 2));
// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`OpenAPI spec written to ${outPath}`);
