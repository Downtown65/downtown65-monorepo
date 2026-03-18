CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`auth0_sub` text NOT NULL,
	`nickname` text NOT NULL,
	`picture` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth0_sub_idx` ON `users` (`auth0_sub`);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ulid` text,
	`title` text NOT NULL,
	`subtitle` text,
	`event_type` text NOT NULL,
	`date_start` text NOT NULL,
	`time_start` text,
	`location` text,
	`description` text,
	`race` integer DEFAULT 0 NOT NULL,
	`creator_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_date_start_idx` ON `events` (`date_start`);
--> statement-breakpoint
CREATE INDEX `events_event_type_idx` ON `events` (`event_type`);
--> statement-breakpoint
CREATE INDEX `events_creator_id_idx` ON `events` (`creator_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_ulid_idx` ON `events` (`ulid`);
--> statement-breakpoint
CREATE TABLE `users_to_events` (
	`user_id` integer NOT NULL,
	`event_id` integer NOT NULL,
	`joined_at` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
