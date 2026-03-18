import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import { jwtAuth } from '@/middleware/auth';
import {
  handleCreateEvent,
  handleDeleteEvent,
  handleGetEvent,
  handleListEvents,
  handleUpdateEvent,
} from './events.handlers';
import {
  createEventRoute,
  deleteEventRoute,
  getEventRoute,
  listEventsRoute,
  updateEventRoute,
} from './events.routes';

const eventsRouter = new OpenAPIHono<AppEnv>();

// Public endpoint (no JWT)
eventsRouter.openapi(getEventRoute, handleGetEvent);

// Protected endpoints (require JWT)
eventsRouter.use('/api/events', jwtAuth());
eventsRouter.use('/api/events/*', jwtAuth());

eventsRouter.openapi(createEventRoute, handleCreateEvent);
eventsRouter.openapi(listEventsRoute, handleListEvents);
eventsRouter.openapi(updateEventRoute, handleUpdateEvent);
eventsRouter.openapi(deleteEventRoute, handleDeleteEvent);

export { eventsRouter };
