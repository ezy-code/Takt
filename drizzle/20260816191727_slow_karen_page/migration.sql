ALTER TABLE `tasks` ADD `parent_id` integer REFERENCES tasks(id) ON DELETE SET NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`status_id` integer,
	`parent_id` integer,
	`my_day_date` text,
	`reminder_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`position` integer DEFAULT 0 NOT NULL,
	`description_md` text DEFAULT '',
	`description_html` text DEFAULT '',
	`canvas_x` real,
	`canvas_y` real,
	`hourly_rate` real,
	`group_id` integer,
	`entity_type` text DEFAULT 'task' NOT NULL,
	CONSTRAINT `tasks_status_id_statuses_id_fk` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`),
	CONSTRAINT `fk_tasks_parent_id_tasks_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_tasks_group_id_canvas_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `canvas_groups`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_tasks`(`id`, `name`, `description`, `status_id`, `my_day_date`, `reminder_at`, `created_at`, `position`, `description_md`, `description_html`, `canvas_x`, `canvas_y`, `hourly_rate`, `group_id`, `entity_type`) SELECT `id`, `name`, `description`, `status_id`, `my_day_date`, `reminder_at`, `created_at`, `position`, `description_md`, `description_html`, `canvas_x`, `canvas_y`, `hourly_rate`, `group_id`, `entity_type` FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP TABLE `projects`;