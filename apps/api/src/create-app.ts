import { DT65_APP_NAME } from '@dt65/shared';
import { Scalar } from '@scalar/hono-api-reference';
import { ENV } from 'varlock/env';
import { createApp } from '@/app';
import { apiKeyAuth } from '@/middleware/api-key';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { createEventsRouter } from '@/routes/events/events.index';
import type { AuthenticationService } from '@/services/authentication-service';

const isDev = ENV.APP_ENV === 'development';

export function createApiApp(authService: AuthenticationService) {
  const app = createApp();

  // Middleware stack
  app.use('/api/*', requestLogger);
  app.use('/api/*', apiKeyAuth);

  // Error handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Routes
  app.route('/api', createEventsRouter(authService));

  // OpenAPI security schemes
  app.openAPIRegistry.registerComponent('securitySchemes', 'apiKey', {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  });

  if (isDev) {
    app.openAPIRegistry.registerComponent('securitySchemes', 'oauth2', {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: `https://${ENV.AUTH0_DOMAIN}/authorize`,
          tokenUrl: `https://${ENV.AUTH0_DOMAIN}/oauth/token`,
          scopes: {},
        },
      },
    });
  }

  // OpenAPI documentation
  app.doc31('/doc', {
    openapi: '3.1.0',
    info: { title: 'DT65 API', version: '1.0.0' },
    security: [{ apiKey: [] }, ...(isDev ? [{ oauth2: [] }] : [])],
  });

  app.get(
    '/scalar',
    Scalar({
      url: '/doc',
      authentication: {
        preferredSecurityScheme: isDev ? 'oauth2' : 'apiKey',
        securitySchemes: {
          apiKey: {},
          ...(isDev && {
            oauth2: {
              clientId: ENV.AUTH0_CLIENT_ID,
              scopes: [],
            },
          }),
        },
      },
      ...(isDev && {
        defaultHttpClient: {
          targetKey: 'javascript',
          clientKey: 'fetch',
        },
      }),
    }),
  );

  // Health check (no auth required)
  app.get('/', (c) => {
    return c.json({ name: DT65_APP_NAME, status: 'ok' });
  });

  return app;
}
