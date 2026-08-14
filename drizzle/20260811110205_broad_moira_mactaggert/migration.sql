CREATE TABLE `task_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_task_id` integer NOT NULL,
	`target_task_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`source_task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_links_source_task_id_target_task_id_unique` ON `task_links` (`source_task_id`,`target_task_id`);