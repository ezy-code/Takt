import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'

export const statuses = sqliteTable('statuses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#868e96'),
  position: integer('position').notNull().default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').default(''),
  statusId: integer('status_id').references(() => statuses.id),
  today_date: text('today_date'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
})

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

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  status: one(statuses, {
    fields: [tasks.statusId],
    references: [statuses.id],
  }),
  timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
}))
