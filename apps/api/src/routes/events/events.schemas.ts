import { EVENT_TYPES } from '@dt65/shared';
import { z } from '@hono/zod-openapi';

const EventTypeSchema = z.enum(EVENT_TYPES).openapi({
  example: 'RUNNING',
});

const ISODateSchema = z.iso.date();
const ISOTimeSchema = z.iso.time({ precision: -1 });

const CreatorSchema = z
  .object({
    id: z.number(),
    nickname: z.string(),
  })
  .openapi('Creator');

const EventBaseSchema = z.object({
  id: z.number(),
  type: EventTypeSchema,
  title: z.string(),
  subtitle: z.string(),
  dateStart: ISODateSchema,
  timeStart: ISOTimeSchema.nullable(),
  location: z.string(),
  race: z.boolean(),
});

export const CreateEventSchema = z
  .object({
    type: EventTypeSchema,
    title: z.string().min(1).max(200),
    dateStart: ISODateSchema,
    timeStart: ISOTimeSchema.optional(),
    location: z.string().max(200),
    subtitle: z.string().max(200),
    description: z.string().optional(),
    race: z.boolean().default(false),
  })
  .openapi('CreateEvent');

export const UpdateEventSchema = z
  .object({
    type: EventTypeSchema.optional(),
    title: z.string().min(1).max(200).optional(),
    dateStart: ISODateSchema.optional(),
    timeStart: ISOTimeSchema.optional(),
    location: z.string().max(200).optional(),
    subtitle: z.string().max(200).optional(),
    description: z.string().optional(),
    race: z.boolean().optional(),
  })
  .openapi('UpdateEvent');

export const EventSchema = EventBaseSchema.extend({
  description: z.string().nullable(),
  creatorId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  participantCount: z.number(),
}).openapi('Event');

export const EventSummarySchema = EventBaseSchema.extend({
  race: z.number().transform((v) => v === 1),
  participantCount: z.number(),
  isParticipant: z.number().transform((v) => v === 1),
  creator: CreatorSchema,
}).openapi('EventSummary');

const ParticipantSchema = z
  .object({
    userId: z.number(),
    nickname: z.string(),
    joinedAt: z.string(),
  })
  .openapi('Participant');

export const EventDetailSchema = EventBaseSchema.extend({
  description: z.string().nullable(),
  creator: CreatorSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  participants: z.array(ParticipantSchema),
}).openapi('EventDetail');

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi('Error');

export const SuccessMessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi('SuccessMessage');

export const IdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: '42' }),
});
