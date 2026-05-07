CREATE TABLE `digest_items` (
	`id` text PRIMARY KEY NOT NULL,
	`digest_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`source_url` text NOT NULL,
	`source_name` text,
	`relevance_score` integer,
	`position` integer NOT NULL,
	FOREIGN KEY (`digest_id`) REFERENCES `digests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `digests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`node_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_id`) REFERENCES `interest_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interest_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`breadcrumb` text NOT NULL,
	`parent_id` text,
	`depth` integer DEFAULT 0 NOT NULL,
	`is_leaf` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`avatar_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);