import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    auth0Sub: text('auth0_sub').notNull(),
    nickname: text('nickname').notNull(),
    picture: text('picture').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('users_auth0_sub_idx').on(table.auth0Sub)],
);

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ulid: text('ulid'), // Legacy ULID from DynamoDB import
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    eventType: text('event_type').notNull(),
    dateStart: text('date_start').notNull(),
    timeStart: text('time_start'),
    location: text('location').notNull(),
    description: text('description'),
    race: integer('race').notNull().default(0),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('events_date_start_idx').on(table.dateStart),
    index('events_event_type_idx').on(table.eventType),
    index('events_creator_id_idx').on(table.creatorId),
    uniqueIndex('events_ulid_idx').on(table.ulid),
  ],
);

export const usersToEvents = sqliteTable(
  'users_to_events',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    eventId: integer('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    joinedAt: text('joined_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventId] })],
);
