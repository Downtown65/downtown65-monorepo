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

const EVENT_TYPE_SET: ReadonlySet<string> = new Set(EVENT_TYPES);

export function toEventType(value: string): EventType {
  if (!EVENT_TYPE_SET.has(value)) {
    throw new Error(`Invalid event type: ${value}`);
  }
  return value as EventType;
}
