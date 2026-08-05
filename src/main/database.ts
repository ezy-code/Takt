import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { app, ipcMain } from 'electron'
import { join } from 'path'
import { createDb } from './db'
import { appMeta, projects, statuses, tasks, timeEntries } from './db/schema'

let db: ReturnType<typeof createDb>

function getDefaultStatusId(): number | undefined {
	const defaultStatus = db.select({ id: statuses.id }).from(statuses).where(eq(statuses.is_default, true)).get()
	if (defaultStatus) return defaultStatus.id
	const first = db.select({ id: statuses.id }).from(statuses).orderBy(asc(statuses.position)).limit(1).get()
	return first?.id
}

function resolveMyDayDate(myDay?: boolean | string | null): string | null {
	if (myDay === true) return new Date().toISOString().split('T')[0]
	if (myDay === false || myDay === null) return null
	if (typeof myDay === 'string') return myDay
	return null
}

export type TimerChangeInfo = { active: false } | { active: true; startTime: string; taskName: string }

export function initDatabase(onTimerChange?: (info: TimerChangeInfo) => void) {
	const dbPath = join(app.getPath('userData'), 'tasks.db')
	db = createDb(dbPath)

	const initialActive = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (initialActive) {
		const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, initialActive.taskId)).get()
		onTimerChange?.({ active: true, startTime: initialActive.startTime, taskName: task?.name ?? 'Unknown' })
	} else {
		onTimerChange?.({ active: false })
	}

	ipcMain.handle('get-meta', (_event, key: string) => {
		return db.select({ value: appMeta.value }).from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null
	})

	ipcMain.handle('set-meta', (_event, key: string, value: string) => {
		db.insert(appMeta).values({ key, value }).onConflictDoUpdate({ target: appMeta.key, set: { value } }).run()
		return { success: true }
	})

	ipcMain.handle('get-projects', () => {
		return db
			.select({
				id: projects.id,
				name: projects.name,
				description: projects.description,
				description_md: projects.descriptionMarkdown,
				description_html: projects.descriptionHtml,
				created_at: projects.created_at,
			})
			.from(projects)
			.orderBy(desc(projects.created_at))
			.all()
	})

	ipcMain.handle('get-project', (_event, id: number) => {
		return db
			.select({
				id: projects.id,
				name: projects.name,
				description: projects.description,
				description_md: projects.descriptionMarkdown,
				description_html: projects.descriptionHtml,
				created_at: projects.created_at,
			})
			.from(projects)
			.where(eq(projects.id, id))
			.get()
	})

	ipcMain.handle(
		'add-project',
		(_event, name: string, description?: string, description_md?: string, description_html?: string) => {
			return db
				.insert(projects)
				.values({
					name,
					description: description ?? '',
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		'update-project',
		(_event, id: number, name: string, description?: string, description_md?: string, description_html?: string) => {
			return db
				.update(projects)
				.set({
					name,
					description: description ?? '',
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
				})
				.where(eq(projects.id, id))
				.returning()
				.get()
		},
	)

	ipcMain.handle('get-statuses', () => {
		return db.select().from(statuses).orderBy(asc(statuses.position)).all()
	})

	ipcMain.handle('add-status', (_event, name: string, color: string) => {
		const maxPos = db
			.select({ maxPos: sql<number>`coalesce(max(${statuses.position}), -1)` })
			.from(statuses)
			.get()
		return db
			.insert(statuses)
			.values({ name, color, position: maxPos!.maxPos + 1 })
			.returning()
			.get()
	})

	ipcMain.handle('update-status', (_event, id: number, name: string, color: string) => {
		return db.update(statuses).set({ name, color }).where(eq(statuses.id, id)).returning().get()
	})

	ipcMain.handle('set-default-status', (_event, id: number) => {
		db.transaction(() => {
			db.update(statuses).set({ is_default: false }).run()
			db.update(statuses).set({ is_default: true }).where(eq(statuses.id, id)).run()
		})
		return db.select().from(statuses).where(eq(statuses.id, id)).get()
	})

	ipcMain.handle('delete-status', (_event, id: number) => {
		const taskCount = db.select({ cnt: sql<number>`count(*)` }).from(tasks).where(eq(tasks.statusId, id)).get()
		if (taskCount!.cnt > 0) return { success: false, reason: 'Has tasks' }
		const status = db.select({ is_default: statuses.is_default }).from(statuses).where(eq(statuses.id, id)).get()
		db.delete(statuses).where(eq(statuses.id, id)).run()
		if (status?.is_default) {
			const next = db.select({ id: statuses.id }).from(statuses).orderBy(asc(statuses.position)).limit(1).get()
			if (next) db.update(statuses).set({ is_default: true }).where(eq(statuses.id, next.id)).run()
		}
		return { success: true }
	})

	ipcMain.handle('reorder-statuses', (_event, ids: number[]) => {
		db.transaction(() => {
			ids.forEach((id, idx) => {
				db.update(statuses).set({ position: idx }).where(eq(statuses.id, id)).run()
			})
		})
		return { success: true }
	})

	ipcMain.handle('move-task', (_event, taskId: number, statusId: number) => {
		const maxPos = db
			.select({ maxPos: sql<number>`coalesce(max(${tasks.position}), -1)` })
			.from(tasks)
			.where(eq(tasks.statusId, statusId))
			.get()
		return db
			.update(tasks)
			.set({ statusId, position: maxPos!.maxPos + 1 })
			.where(eq(tasks.id, taskId))
			.returning()
			.get()
	})

	ipcMain.handle('reorder-tasks', (_event, _columnId: number, orderedTaskIds: number[]) => {
		db.transaction(() => {
			orderedTaskIds.forEach((id, idx) => {
				db.update(tasks).set({ position: idx }).where(eq(tasks.id, id)).run()
			})
		})
		return { success: true }
	})

	ipcMain.handle('get-tasks', () => {
		return db
			.select({
				id: tasks.id,
				name: tasks.name,
				description: tasks.description,
				description_md: tasks.descriptionMarkdown,
				description_html: tasks.descriptionHtml,
				statusId: tasks.statusId,
				projectId: tasks.projectId,
				my_day_date: tasks.my_day_date,
				created_at: tasks.created_at,
				position: tasks.position,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.groupBy(tasks.id)
			.orderBy(asc(tasks.position), desc(tasks.created_at))
			.all()
	})

	ipcMain.handle('get-task', (_event, id: number) => {
		return db
			.select({
				id: tasks.id,
				name: tasks.name,
				description: tasks.description,
				description_md: tasks.descriptionMarkdown,
				description_html: tasks.descriptionHtml,
				statusId: tasks.statusId,
				projectId: tasks.projectId,
				my_day_date: tasks.my_day_date,
				created_at: tasks.created_at,
				position: tasks.position,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(eq(tasks.id, id))
			.groupBy(tasks.id)
			.get()
	})

	ipcMain.handle(
		'add-task',
		(
			_event,
			name: string,
			description: string,
			description_md?: string,
			description_html?: string,
			statusId?: number,
			projectId?: number,
			myDay?: boolean | string | null,
		) => {
			const resolvedStatusId = statusId ?? getDefaultStatusId()
			const my_day_date = resolveMyDayDate(myDay)
			const maxPos = db
				.select({ maxPos: sql<number>`coalesce(max(${tasks.position}), -1)` })
				.from(tasks)
				.where(eq(tasks.statusId, resolvedStatusId))
				.get()
			return db
				.insert(tasks)
				.values({
					name,
					description,
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
					statusId: resolvedStatusId,
					projectId,
					my_day_date,
					position: maxPos!.maxPos + 1,
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		'update-task',
		(
			_event,
			id: number,
			name: string,
			description: string,
			description_md?: string,
			description_html?: string,
			statusId?: number,
			projectId?: number,
			myDay?: boolean | string | null,
		) => {
			const updates: {
				name: string
				description: string
				descriptionMarkdown: string
				descriptionHtml: string
				statusId?: number
				projectId?: number
				my_day_date?: string | null
			} = {
				name,
				description,
				descriptionMarkdown: description_md ?? '',
				descriptionHtml: description_html ?? '',
			}
			if (statusId !== undefined) updates.statusId = statusId
			if (projectId !== undefined) updates.projectId = projectId
			if (myDay !== undefined) updates.my_day_date = resolveMyDayDate(myDay)
			return db.update(tasks).set(updates).where(eq(tasks.id, id)).returning().get()
		},
	)

	ipcMain.handle('delete-task', (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.taskId, id)).run()
		db.delete(tasks).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	ipcMain.handle('get-active-timer', () => {
		const entry = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (!entry) return null

		const task = db
			.select({
				id: tasks.id,
				name: tasks.name,
				description: tasks.description,
				description_md: tasks.descriptionMarkdown,
				description_html: tasks.descriptionHtml,
				statusId: tasks.statusId,
				projectId: tasks.projectId,
				created_at: tasks.created_at,
				position: tasks.position,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(eq(tasks.id, entry.taskId))
			.groupBy(tasks.id)
			.get()

		return { entry, task }
	})

	ipcMain.handle('start-timer', (_event, taskId: number) => {
		const active = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (active) {
			const activeTask = db.select().from(tasks).where(eq(tasks.id, active.taskId)).get()
			return { conflict: true, activeEntry: active, activeTask }
		}

		const now = new Date().toISOString()
		const entry = db.insert(timeEntries).values({ taskId, startTime: now }).returning().get()

		const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, taskId)).get()
		onTimerChange?.({ active: true, startTime: now, taskName: task?.name ?? 'Unknown' })
		return { conflict: false, entry }
	})

	ipcMain.handle('stop-timer', (_event, taskId: number) => {
		const active = db
			.select()
			.from(timeEntries)
			.where(sql`${timeEntries.stopTime} is null and ${timeEntries.taskId} = ${taskId}`)
			.limit(1)
			.all()[0]

		if (!active) return null

		const now = new Date().toISOString()
		const start = new Date(active.startTime).getTime()
		const end = new Date(now).getTime()
		const duration = Math.floor((end - start) / 1000)

		const entry = db
			.update(timeEntries)
			.set({ stopTime: now, duration })
			.where(eq(timeEntries.id, active.id))
			.returning()
			.get()

		onTimerChange?.({ active: false })
		return entry
	})

	ipcMain.handle('get-all-time-entries', () => {
		return db
			.select({
				id: timeEntries.id,
				taskId: timeEntries.taskId,
				taskName: tasks.name,
				startTime: timeEntries.startTime,
				stopTime: timeEntries.stopTime,
				duration: timeEntries.duration,
			})
			.from(timeEntries)
			.leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
			.orderBy(desc(timeEntries.startTime))
			.all()
	})

	ipcMain.handle('get-time-summary', () => {
		const total = db
			.select({
				totalSessions: count(),
				totalDuration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(timeEntries)
			.get()

		const today = db
			.select({
				todayDuration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(timeEntries)
			.where(sql`date(${timeEntries.startTime}) = date('now')`)
			.get()

		return { ...total, ...today }
	})

	ipcMain.handle('delete-time-entry', (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
		return { success: true }
	})

	ipcMain.handle('toggle-my-day', (_event, id: number) => {
		const task = db.select({ my_day_date: tasks.my_day_date }).from(tasks).where(eq(tasks.id, id)).get()
		const newDate =
			task?.my_day_date === new Date().toISOString().split('T')[0] ? null : new Date().toISOString().split('T')[0]
		db.update(tasks).set({ my_day_date: newDate }).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	ipcMain.handle('get-my-day-tasks', () => {
		return db
			.select({
				id: tasks.id,
				name: tasks.name,
				description: tasks.description,
				description_md: tasks.descriptionMarkdown,
				description_html: tasks.descriptionHtml,
				statusId: tasks.statusId,
				projectId: tasks.projectId,
				my_day_date: tasks.my_day_date,
				created_at: tasks.created_at,
				position: tasks.position,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(sql`${tasks.my_day_date} is not null`)
			.groupBy(tasks.id)
			.orderBy(asc(tasks.position), desc(tasks.created_at))
			.all()
	})

	ipcMain.handle('clear-my-day-date', (_event, id: number) => {
		db.update(tasks).set({ my_day_date: null }).where(eq(tasks.id, id)).run()
		return { success: true }
	})
}
