import { createRoute } from '@hono/zod-openapi';
import {
  CreateEventSchema,
  ErrorSchema,
  EventDetailSchema,
  EventSchema,
  EventSummarySchema,
  IdParamSchema,
  SuccessMessageSchema,
  UpdateEventSchema,
} from './events.schemas';

export const createEventRoute = createRoute({
  method: 'post',
  path: '/events',
  tags: ['Events'],
  summary: 'Create a new event',
  request: {
    body: {
      content: { 'application/json': { schema: CreateEventSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: EventSchema } },
      description: 'Event created',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Validation error',
    },
  },
});

export const listEventsRoute = createRoute({
  method: 'get',
  path: '/events',
  tags: ['Events'],
  summary: 'List upcoming events',
  responses: {
    200: {
      content: { 'application/json': { schema: EventSummarySchema.array() } },
      description: 'List of upcoming events',
    },
  },
});

export const getEventRoute = createRoute({
  method: 'get',
  path: '/events/{id}',
  tags: ['Events (Public)'],
  summary: 'Get event details (public)',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: EventDetailSchema } },
      description: 'Event details with participants',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Event not found',
    },
  },
});

export const updateEventRoute = createRoute({
  method: 'put',
  path: '/events/{id}',
  tags: ['Events'],
  summary: 'Update an event',
  request: {
    params: IdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateEventSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: 'Event updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Event not found',
    },
  },
});

export const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/events/{id}',
  tags: ['Events'],
  summary: 'Delete an event (owner only)',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Event deleted',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not the event owner',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Event not found',
    },
  },
});

export const joinEventRoute = createRoute({
  method: 'post',
  path: '/events/{id}/participants',
  tags: ['Participants'],
  summary: 'Join an event',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessMessageSchema } },
      description: 'Successfully joined event',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Cannot join past event',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Event not found',
    },
  },
});

export const leaveEventRoute = createRoute({
  method: 'delete',
  path: '/events/{id}/participants',
  tags: ['Participants'],
  summary: 'Leave an event',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessMessageSchema } },
      description: 'Successfully left event',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Cannot leave past event',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Event not found',
    },
  },
});
