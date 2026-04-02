CREATE TABLE `pending_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `query_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`timestamp` integer NOT NULL
);
