import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import { jwtAuth } from '@/middleware/auth';
import type { AuthenticationService } from '@/services/authentication-service';
import {
  handleCreateEvent,
  handleDeleteEvent,
  handleGetEvent,
  handleJoinEvent,
  handleLeaveEvent,
  handleListEvents,
  handleUpdateEvent,
} from './events.handlers';
import {
  createEventRoute,
  deleteEventRoute,
  getEventRoute,
  joinEventRoute,
  leaveEventRoute,
  listEventsRoute,
  updateEventRoute,
} from './events.routes';

export function createEventsRouter(authService: AuthenticationService) {
  const eventsRouter = new OpenAPIHono<AppEnv>();

  // Public endpoint (no JWT)
  eventsRouter.openapi(getEventRoute, handleGetEvent);

  // Protected endpoints (require JWT)
  eventsRouter.use('/api/events', jwtAuth(authService));
  eventsRouter.use('/api/events/*', jwtAuth(authService));

  eventsRouter.openapi(createEventRoute, handleCreateEvent);
  eventsRouter.openapi(listEventsRoute, handleListEvents);
  eventsRouter.openapi(updateEventRoute, handleUpdateEvent);
  eventsRouter.openapi(deleteEventRoute, handleDeleteEvent);
  eventsRouter.openapi(joinEventRoute, handleJoinEvent);
  eventsRouter.openapi(leaveEventRoute, handleLeaveEvent);

  return eventsRouter;
}
