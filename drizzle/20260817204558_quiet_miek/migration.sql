PRAGMA foreign_keys = OFF;--> statement-breakpoint
DROP TRIGGER IF EXISTS `tasks_search_ai`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `tasks_search_ad`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `tasks_search_au`;--> statement-breakpoint
ALTER TABLE `tasks` RENAME TO `items`;--> statement-breakpoint
ALTER TABLE `time_entries` RENAME COLUMN `task_id` TO `item_id`;--> statement-breakpoint
DROP TABLE `entity_search_fts`;--> statement-breakpoint
CREATE VIRTUAL TABLE `entity_search_fts` USING fts5(
	`name`,
	`description_md`,
	content='items',
	content_rowid='id',
	tokenize='unicode61 remove_diacritics 1'
);--> statement-breakpoint
INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
SELECT `id`, `name`, coalesce(`description_md`, '')
FROM `items`;--> statement-breakpoint
CREATE TRIGGER `items_search_ai`
AFTER INSERT ON `items`
BEGIN
	INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
	VALUES (new.`id`, new.`name`, coalesce(new.`description_md`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `items_search_ad`
AFTER DELETE ON `items`
BEGIN
	INSERT INTO `entity_search_fts`(`entity_search_fts`, `rowid`, `name`, `description_md`)
	VALUES ('delete', old.`id`, old.`name`, coalesce(old.`description_md`, ''));
END;--> statement-breakpoint
CREATE TRIGGER `items_search_au`
AFTER UPDATE OF `name`, `description_md` ON `items`
BEGIN
	INSERT INTO `entity_search_fts`(`entity_search_fts`, `rowid`, `name`, `description_md`)
	VALUES ('delete', old.`id`, old.`name`, coalesce(old.`description_md`, ''));
	INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
	VALUES (new.`id`, new.`name`, coalesce(new.`description_md`, ''));
END;--> statement-breakpoint
PRAGMA foreign_keys = ON;
