import { createRequestHandler } from 'react-router';

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ExportedHandler<E = unknown> {
  fetch?: (request: Request, env: E, ctx: ExecutionContext) => Response | Promise<Response>;
}

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

interface Env {
  [key: string]: string;
}

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
