import { z } from 'zod';

export const DT65_APP_NAME = 'Downtown 65';

export const EVENT_TYPES = [
  'CYCLING',
  'KARONKKA',
  'MEETING',
  'NORDIC_WALKING',
  'ICE_HOCKEY',
  'ORIENTEERING',
  'OTHER',
  'RUNNING',
  'SKIING',
  'SPINNING',
  'SWIMMING',
  'TRACK_RUNNING',
  'TRAIL_RUNNING',
  'TRIATHLON',
  'ULTRAS',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

const EventTypeSchema = z.enum(EVENT_TYPES);

export function isEventType(value: string): value is EventType {
  return EventTypeSchema.safeParse(value).success;
}

export function toEventType(value: string): EventType {
  return EventTypeSchema.parse(value);
}
