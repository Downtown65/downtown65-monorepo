import { DT65_APP_NAME } from '@dt65/shared';
import { Scalar } from '@scalar/hono-api-reference';
import { createApp } from '@/app';
import { apiKeyMiddleware } from '@/middleware/api-key';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import { eventsRouter } from '@/routes/events/events.index';

const app = createApp();

// Middleware stack
app.use('/api/*', apiKeyMiddleware());

// Error handlers
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Routes
app.route('/', eventsRouter);

// OpenAPI documentation
app.doc31('/doc', {
  openapi: '3.1.0',
  info: { title: 'DT65 API', version: '1.0.0' },
});

app.get('/scalar', Scalar({ url: '/doc' }));

// Health check (no auth required)
app.get('/', (c) => {
  return c.json({ name: DT65_APP_NAME, status: 'ok' });
});

export default app;
