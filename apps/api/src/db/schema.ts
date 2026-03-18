import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Auth0 sub (e.g., "auth0|abc123")
  nickname: text('nickname').notNull(),
  picture: text('picture').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(), // ULID from DynamoDB
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    eventType: text('event_type').notNull(), // validated in API layer, not DB
    dateStart: text('date_start').notNull(), // ISO date string
    timeStart: text('time_start'),
    location: text('location'),
    description: text('description'), // raw HTML
    race: integer('race').notNull().default(0), // boolean as 0/1
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('events_date_start_idx').on(table.dateStart),
    index('events_event_type_idx').on(table.eventType),
    index('events_creator_id_idx').on(table.creatorId),
  ],
);

export const usersToEvents = sqliteTable(
  'users_to_events',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    joinedAt: text('joined_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventId] })],
);
