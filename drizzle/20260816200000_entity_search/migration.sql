CREATE VIRTUAL TABLE `entity_search_fts` USING fts5(
	`name`,
	`description_md`,
	content='tasks',
	content_rowid='id',
	tokenize='unicode61 remove_diacritics 1'
);
--> statement-breakpoint
INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
SELECT `id`, `name`, coalesce(`description_md`, '')
FROM `tasks`;
--> statement-breakpoint
CREATE TRIGGER `tasks_search_ai`
AFTER INSERT ON `tasks`
BEGIN
	INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
	VALUES (new.`id`, new.`name`, coalesce(new.`description_md`, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `tasks_search_ad`
AFTER DELETE ON `tasks`
BEGIN
	INSERT INTO `entity_search_fts`(`entity_search_fts`, `rowid`, `name`, `description_md`)
	VALUES ('delete', old.`id`, old.`name`, coalesce(old.`description_md`, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `tasks_search_au`
AFTER UPDATE OF `name`, `description_md` ON `tasks`
BEGIN
	INSERT INTO `entity_search_fts`(`entity_search_fts`, `rowid`, `name`, `description_md`)
	VALUES ('delete', old.`id`, old.`name`, coalesce(old.`description_md`, ''));
	INSERT INTO `entity_search_fts`(`rowid`, `name`, `description_md`)
	VALUES (new.`id`, new.`name`, coalesce(new.`description_md`, ''));
END;
