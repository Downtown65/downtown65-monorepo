import { eq } from 'drizzle-orm';
import { events } from '@/db/schema';

/**
 * Parse a route param as either an integer ID or a legacy ULID.
 * Returns the appropriate Drizzle query condition.
 */
export function eventIdCondition(idParam: string) {
  const numericId = Number(idParam);
  if (Number.isInteger(numericId) && numericId > 0) {
    return eq(events.id, numericId);
  }
  return eq(events.ulid, idParam);
}
