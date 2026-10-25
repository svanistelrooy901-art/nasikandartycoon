CREATE TABLE `league_members` (
	`league_id` text NOT NULL,
	`player_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`league_id`, `player_id`),
	FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `league_members_player` ON `league_members` (`player_id`);--> statement-breakpoint
CREATE TABLE `leagues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leagues_invite_code_unique` ON `leagues` (`invite_code`);--> statement-breakpoint
CREATE INDEX `leagues_owner` ON `leagues` (`owner_id`);