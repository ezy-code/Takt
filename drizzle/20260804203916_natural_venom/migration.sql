CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description_md` text DEFAULT '',
	`description_html` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `project_id` integer REFERENCES projects(id);