import { DT65_APP_NAME } from '@dt65/shared';
import { Scalar } from '@scalar/hono-api-reference';
import { createApp } from '@/app';
import { apiKeyAuth } from '@/middleware/api-key';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import { createEventsRouter } from '@/routes/events/events.index';
import type { AuthenticationService } from '@/services/authentication-service';

export function createApiApp(authService: AuthenticationService) {
  const app = createApp();

  // Middleware stack
  app.use('/api/*', apiKeyAuth);

  // Error handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  // Routes
  app.route('/api', createEventsRouter(authService));

  // OpenAPI security scheme
  app.openAPIRegistry.registerComponent('securitySchemes', 'apiKey', {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  });

  // OpenAPI documentation
  app.doc31('/doc', {
    openapi: '3.1.0',
    info: { title: 'DT65 API', version: '1.0.0' },
    security: [{ apiKey: [] }],
  });

  app.get(
    '/scalar',
    Scalar({
      url: '/doc',
      authentication: {
        preferredSecurityScheme: 'apiKey',
        securitySchemes: {
          apiKey: {
            value: 'x-api-key-secret',
          },
        },
      },
    }),
  );

  // Health check (no auth required)
  app.get('/', (c) => {
    return c.json({ name: DT65_APP_NAME, status: 'ok' });
  });

  return app;
}
