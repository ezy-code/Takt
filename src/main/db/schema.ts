import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm/_relations'
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const appMeta = sqliteTable('app_meta', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
})

export const statuses = sqliteTable('statuses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	color: text('color').notNull().default('#868e96'),
	position: integer('position').notNull().default(0),
	is_default: integer('is_default', { mode: 'boolean' }).notNull().default(false),
	created_at: text('created_at').default(sql`(datetime('now'))`),
})

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	description: text('description').default(''),
	descriptionMarkdown: text('description_md').default(''),
	descriptionHtml: text('description_html').default(''),
	created_at: text('created_at').default(sql`(datetime('now'))`),
	hourly_rate: real('hourly_rate'),
})

export const canvasGroups = sqliteTable('canvas_groups', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	canvasX: real('canvas_x'),
	canvasY: real('canvas_y'),
	width: real('width').notNull().default(320),
	height: real('height').notNull().default(220),
	color: text('color').notNull().default('#868e96'),
	created_at: text('created_at').default(sql`(datetime('now'))`),
})

export const tasks = sqliteTable('tasks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	description: text('description').default(''),
	statusId: integer('status_id').references(() => statuses.id),
	projectId: integer('project_id').references(() => projects.id),
	my_day_date: text('my_day_date'),
	reminderAt: text('reminder_at'),
	created_at: text('created_at').default(sql`(datetime('now'))`),
	position: integer('position').notNull().default(0),
	descriptionMarkdown: text('description_md').default(''),
	descriptionHtml: text('description_html').default(''),
	canvasX: real('canvas_x'),
	canvasY: real('canvas_y'),
	hourly_rate: real('hourly_rate'),
	groupId: integer('group_id').references(() => canvasGroups.id, { onDelete: 'set null' }),
})

export const taskLinks = sqliteTable(
	'task_links',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		sourceTaskId: integer('source_task_id')
			.notNull()
			.references(() => tasks.id),
		targetTaskId: integer('target_task_id')
			.notNull()
			.references(() => tasks.id),
		created_at: text('created_at').default(sql`(datetime('now'))`),
	},
	(t) => ({
		uniquePair: unique().on(t.sourceTaskId, t.targetTaskId),
	}),
)

export const timeEntries = sqliteTable('time_entries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	taskId: integer('task_id')
		.notNull()
		.references(() => tasks.id),
	startTime: text('start_time').notNull(),
	stopTime: text('stop_time'),
	duration: integer('duration'),
	created_at: text('created_at').default(sql`(datetime('now'))`),
})

export const statusesRelations = relations(statuses, ({ many }) => ({
	tasks: many(tasks),
}))

export const projectsRelations = relations(projects, ({ many }) => ({
	tasks: many(tasks),
}))

export const canvasGroupsRelations = relations(canvasGroups, ({ many }) => ({
	tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ many, one }) => ({
	status: one(statuses, {
		fields: [tasks.statusId],
		references: [statuses.id],
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id],
	}),
	group: one(canvasGroups, {
		fields: [tasks.groupId],
		references: [canvasGroups.id],
	}),
	timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
	task: one(tasks, {
		fields: [timeEntries.taskId],
		references: [tasks.id],
	}),
}))
