import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/app';
import {
  createEvent,
  deleteEvent,
  getEventById,
  listUpcomingEvents,
  updateEvent,
} from '@/services/event-service';
import { joinEvent, leaveEvent } from '@/services/participant-service';
import type {
  createEventRoute,
  deleteEventRoute,
  getEventRoute,
  joinEventRoute,
  leaveEventRoute,
  listEventsRoute,
  updateEventRoute,
} from './events.routes';

export const handleCreateEvent: RouteHandler<typeof createEventRoute, AppEnv> = async (c) => {
  const body = c.req.valid('json');
  const { sub } = c.get('jwtPayload');
  const event = await createEvent(c.env.DB, body, sub);
  return c.json(event, 201);
};

export const handleListEvents: RouteHandler<typeof listEventsRoute, AppEnv> = async (c) => {
  const eventList = await listUpcomingEvents(c.env.DB);
  return c.json(eventList, 200);
};

export const handleGetEvent: RouteHandler<typeof getEventRoute, AppEnv> = async (c) => {
  const { id } = c.req.valid('param');
  const event = await getEventById(c.env.DB, id);

  if (!event) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
  }

  return c.json(event, 200);
};

export const handleUpdateEvent: RouteHandler<typeof updateEventRoute, AppEnv> = async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const { sub } = c.get('jwtPayload');

  const result = await updateEvent(c.env.DB, id, body, sub);

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
    }
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not the event owner' } }, 403);
  }

  return c.json(result.data, 200);
};

export const handleDeleteEvent: RouteHandler<typeof deleteEventRoute, AppEnv> = async (c) => {
  const { id } = c.req.valid('param');
  const { sub } = c.get('jwtPayload');

  const result = await deleteEvent(c.env.DB, id, sub);

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
    }
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not the event owner' } }, 403);
  }

  return c.body(null, 204);
};

export const handleJoinEvent: RouteHandler<typeof joinEventRoute, AppEnv> = async (c) => {
  const { id } = c.req.valid('param');
  const { sub } = c.get('jwtPayload');

  const result = await joinEvent(c.env.DB, id, sub);

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
    }
    return c.json({ error: { code: 'PAST_EVENT', message: 'Cannot join a past event' } }, 400);
  }

  return c.json({ message: 'Joined event' }, 200);
};

export const handleLeaveEvent: RouteHandler<typeof leaveEventRoute, AppEnv> = async (c) => {
  const { id } = c.req.valid('param');
  const { sub } = c.get('jwtPayload');

  const result = await leaveEvent(c.env.DB, id, sub);

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, 404);
    }
    return c.json({ error: { code: 'PAST_EVENT', message: 'Cannot leave a past event' } }, 400);
  }

  return c.json({ message: 'Left event' }, 200);
};
