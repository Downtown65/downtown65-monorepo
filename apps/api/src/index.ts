import { DT65_APP_NAME } from '@dt65/shared';
import { Hono } from 'hono';
import { ENV } from 'varlock/env';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    name: DT65_APP_NAME,
    status: 'ok',
    env: ENV.TEST_VALUE,
    xApiKey: ENV.X_API_KEY.length > 0 ? 'is set' : 'not set',
  });
});

export default app;
