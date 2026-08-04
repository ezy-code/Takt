ALTER TABLE `statuses` ADD `is_default` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `statuses` SET `is_default` = 1 WHERE `id` = (SELECT id FROM `statuses` ORDER BY `position` LIMIT 1);
