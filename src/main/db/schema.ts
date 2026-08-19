import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm/_relations'
import { type AnySQLiteColumn, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const appMeta = sqliteTable('app_meta', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
})

export const statuses = sqliteTable('statuses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	color: text('color').notNull().default('#868e96'),
	position: integer('position').notNull().default(0),
	isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const groups = sqliteTable('groups', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	parentId: integer('parent_id').references((): AnySQLiteColumn => groups.id, { onDelete: 'set null' }),
	canvasX: real('canvas_x'),
	canvasY: real('canvas_y'),
	width: real('width').notNull().default(320),
	height: real('height').notNull().default(220),
	color: text('color').notNull().default('#868e96'),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const items = sqliteTable('items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	description: text('description').default(''),
	statusId: integer('status_id').references(() => statuses.id),
	parentId: integer('parent_id').references((): AnySQLiteColumn => items.id, { onDelete: 'set null' }),
	myDayDate: text('my_day_date'),
	reminderAt: text('reminder_at'),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
	position: integer('position').notNull().default(0),
	descriptionMd: text('description_md').default(''),
	descriptionHtml: text('description_html').default(''),
	canvasX: real('canvas_x'),
	canvasY: real('canvas_y'),
	canvasWidth: real('canvas_width').notNull().default(260),
	canvasHeight: real('canvas_height').notNull().default(200),
	hourlyRate: real('hourly_rate'),
	groupId: integer('group_id').references(() => groups.id, { onDelete: 'set null' }),
	entityType: text('entity_type').notNull().default('task'),
})

export const timeEntries = sqliteTable('time_entries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	itemId: integer('item_id')
		.notNull()
		.references(() => items.id),
	startTime: text('start_time').notNull(),
	stopTime: text('stop_time'),
	duration: integer('duration'),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const statusesRelations = relations(statuses, ({ many }) => ({
	items: many(items),
}))

export const groupsRelations = relations(groups, ({ many, one }) => ({
	parent: one(groups, {
		fields: [groups.parentId],
		references: [groups.id],
		relationName: 'groupParent',
	}),
	children: many(groups, {
		relationName: 'groupParent',
	}),
	items: many(items),
}))

export const itemsRelations = relations(items, ({ many, one }) => ({
	status: one(statuses, {
		fields: [items.statusId],
		references: [statuses.id],
	}),
	parent: one(items, {
		fields: [items.parentId],
		references: [items.id],
		relationName: 'parent',
	}),
	children: many(items, {
		relationName: 'parent',
	}),
	group: one(groups, {
		fields: [items.groupId],
		references: [groups.id],
	}),
	timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
	item: one(items, {
		fields: [timeEntries.itemId],
		references: [items.id],
	}),
}))
