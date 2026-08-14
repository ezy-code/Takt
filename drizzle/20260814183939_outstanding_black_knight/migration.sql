CREATE TABLE `canvas_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`canvas_x` real,
	`canvas_y` real,
	`width` real DEFAULT 320 NOT NULL,
	`height` real DEFAULT 220 NOT NULL,
	`color` text DEFAULT '#868e96' NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `group_id` integer REFERENCES canvas_groups(id) ON DELETE SET NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`source_task_id` integer NOT NULL,
	`target_task_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	CONSTRAINT `task_links_source_task_id_tasks_id_fk` FOREIGN KEY (`source_task_id`) REFERENCES `tasks`(`id`),
	CONSTRAINT `task_links_target_task_id_tasks_id_fk` FOREIGN KEY (`target_task_id`) REFERENCES `tasks`(`id`),
	CONSTRAINT `task_links_source_task_id_target_task_id_unique` UNIQUE(`source_task_id`,`target_task_id`)
);
--> statement-breakpoint
INSERT INTO `__new_task_links`(`id`, `source_task_id`, `target_task_id`, `created_at`) SELECT `id`, `source_task_id`, `target_task_id`, `created_at` FROM `task_links`;--> statement-breakpoint
DROP TABLE `task_links`;--> statement-breakpoint
ALTER TABLE `__new_task_links` RENAME TO `task_links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `task_links_source_task_id_target_task_id_unique`;