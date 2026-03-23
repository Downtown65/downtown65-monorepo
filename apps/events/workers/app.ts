import { createRequestHandler } from 'react-router';

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

const requestHandler = createRequestHandler(
  // @ts-expect-error virtual module provided by React Router Vite plugin
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
