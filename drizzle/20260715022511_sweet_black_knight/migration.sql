CREATE TABLE `statuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#868e96' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `status_id` integer REFERENCES statuses(id);
--> statement-breakpoint
INSERT INTO `statuses` (`name`, `color`, `position`) VALUES ('To Do', '#868e96', 0);
--> statement-breakpoint
INSERT INTO `statuses` (`name`, `color`, `position`) VALUES ('In Progress', '#228be6', 1);
--> statement-breakpoint
INSERT INTO `statuses` (`name`, `color`, `position`) VALUES ('Done', '#40c057', 2);
--> statement-breakpoint
UPDATE `tasks` SET `status_id` = 1 WHERE `status_id` IS NULL;