import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { app, BrowserWindow, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { META_LANGUAGE_KEY } from '../shared/constants'
import { IPC } from '../shared/ipc'
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

export function getMeta(key: string): string | null {
	return db.select({ value: appMeta.value }).from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null
}

export function setMeta(key: string, value: string): void {
	db.insert(appMeta).values({ key, value }).onConflictDoUpdate({ target: appMeta.key, set: { value } }).run()
}

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

	ipcMain.handle(IPC.GET_META, (_event, key: string) => getMeta(key))

	ipcMain.handle(IPC.SET_META, (_event, key: string, value: string) => {
		setMeta(key, value)
		return { success: true }
	})

	ipcMain.handle(IPC.GET_PROJECTS, () => {
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

	ipcMain.handle(IPC.GET_PROJECT, (_event, id: number) => {
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
		IPC.ADD_PROJECT,
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
		IPC.UPDATE_PROJECT,
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

	ipcMain.handle(IPC.GET_STATUSES, () => {
		return db.select().from(statuses).orderBy(asc(statuses.position)).all()
	})

	ipcMain.handle(IPC.ADD_STATUS, (_event, name: string, color: string) => {
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

	ipcMain.handle(IPC.UPDATE_STATUS, (_event, id: number, name: string, color: string) => {
		return db.update(statuses).set({ name, color }).where(eq(statuses.id, id)).returning().get()
	})

	ipcMain.handle(IPC.SET_DEFAULT_STATUS, (_event, id: number) => {
		db.transaction(() => {
			db.update(statuses).set({ is_default: false }).run()
			db.update(statuses).set({ is_default: true }).where(eq(statuses.id, id)).run()
		})
		return db.select().from(statuses).where(eq(statuses.id, id)).get()
	})

	ipcMain.handle(IPC.DELETE_STATUS, (_event, id: number) => {
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

	ipcMain.handle(IPC.REORDER_STATUSES, (_event, ids: number[]) => {
		db.transaction(() => {
			ids.forEach((id, idx) => {
				db.update(statuses).set({ position: idx }).where(eq(statuses.id, id)).run()
			})
		})
		return { success: true }
	})

	ipcMain.handle(IPC.MOVE_TASK, (_event, taskId: number, statusId: number) => {
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

	ipcMain.handle(IPC.REORDER_TASKS, (_event, _columnId: number, orderedTaskIds: number[]) => {
		db.transaction(() => {
			orderedTaskIds.forEach((id, idx) => {
				db.update(tasks).set({ position: idx }).where(eq(tasks.id, id)).run()
			})
		})
		return { success: true }
	})

	ipcMain.handle(IPC.UPDATE_TASK_CANVAS_POSITION, (_event, id: number, x: number, y: number) => {
		return db.update(tasks).set({ canvasX: x, canvasY: y }).where(eq(tasks.id, id)).returning().get()
	})

	ipcMain.handle(IPC.GET_TASKS, () => {
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
				reminder_at: tasks.reminderAt,
				created_at: tasks.created_at,
				position: tasks.position,
				canvasX: tasks.canvasX,
				canvasY: tasks.canvasY,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.groupBy(tasks.id)
			.orderBy(asc(tasks.position), desc(tasks.created_at))
			.all()
	})

	ipcMain.handle(IPC.GET_TASK, (_event, id: number) => {
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
				reminder_at: tasks.reminderAt,
				created_at: tasks.created_at,
				position: tasks.position,
				canvasX: tasks.canvasX,
				canvasY: tasks.canvasY,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(eq(tasks.id, id))
			.groupBy(tasks.id)
			.get()
	})

	ipcMain.handle(
		IPC.ADD_TASK,
		(
			_event,
			name: string,
			description: string,
			description_md?: string,
			description_html?: string,
			statusId?: number,
			projectId?: number,
			myDay?: boolean | string | null,
			reminderAt?: string | null,
		) => {
			const resolvedStatusId = statusId ?? getDefaultStatusId()
			if (resolvedStatusId == null) throw new Error('No statuses configured')
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
					reminderAt: reminderAt ?? null,
					position: maxPos!.maxPos + 1,
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		IPC.UPDATE_TASK,
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
			reminderAt?: string | null,
		) => {
			const updates: {
				name: string
				description: string
				descriptionMarkdown: string
				descriptionHtml: string
				statusId?: number
				projectId?: number
				my_day_date?: string | null
				reminderAt?: string | null
			} = {
				name,
				description,
				descriptionMarkdown: description_md ?? '',
				descriptionHtml: description_html ?? '',
			}
			if (statusId !== undefined) updates.statusId = statusId
			if (projectId !== undefined) updates.projectId = projectId
			if (myDay !== undefined) updates.my_day_date = resolveMyDayDate(myDay)
			if (reminderAt !== undefined) updates.reminderAt = reminderAt
			return db.update(tasks).set(updates).where(eq(tasks.id, id)).returning().get()
		},
	)

	ipcMain.handle(IPC.DELETE_TASK, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.taskId, id)).run()
		db.delete(tasks).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	function selectTimerTask(taskId: number) {
		return db
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
				canvasX: tasks.canvasX,
				canvasY: tasks.canvasY,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(eq(tasks.id, taskId))
			.groupBy(tasks.id)
			.get()
	}

	ipcMain.handle(IPC.GET_ACTIVE_TIMER, () => {
		const entry = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (!entry) return null

		const task = selectTimerTask(entry.taskId)

		return { entry, task }
	})

	ipcMain.handle(IPC.GET_LAST_TIMER, () => {
		const entry = db.select().from(timeEntries).orderBy(desc(timeEntries.startTime)).limit(1).all()[0]

		if (!entry) return null

		const task = selectTimerTask(entry.taskId)
		if (!task) return null

		return { entry, task }
	})

	ipcMain.handle(IPC.START_TIMER, (_event, taskId: number) => {
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

	ipcMain.handle(IPC.STOP_TIMER, (_event, taskId: number) => {
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

	ipcMain.handle(IPC.GET_ALL_TIME_ENTRIES, () => {
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

	ipcMain.handle(IPC.GET_TIME_SUMMARY, () => {
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

	ipcMain.handle(IPC.DELETE_TIME_ENTRY, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.TOGGLE_MY_DAY, (_event, id: number) => {
		const task = db.select({ my_day_date: tasks.my_day_date }).from(tasks).where(eq(tasks.id, id)).get()
		const newDate =
			task?.my_day_date === new Date().toISOString().split('T')[0] ? null : new Date().toISOString().split('T')[0]
		db.update(tasks).set({ my_day_date: newDate }).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.GET_MY_DAY_TASKS, () => {
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
				reminder_at: tasks.reminderAt,
				created_at: tasks.created_at,
				position: tasks.position,
				canvasX: tasks.canvasX,
				canvasY: tasks.canvasY,
				total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			})
			.from(tasks)
			.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
			.where(sql`${tasks.my_day_date} is not null`)
			.groupBy(tasks.id)
			.orderBy(asc(tasks.position), desc(tasks.created_at))
			.all()
	})

	ipcMain.handle(IPC.CLEAR_MY_DAY, (_event, id: number) => {
		db.update(tasks).set({ my_day_date: null }).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	// ponytail: in-memory notified set, resets on restart — a reminder still inside the
	// fire window re-fires once on launch (desired). Laptop sleep through the
	// window can skip a reminder; persist a `notified` flag in the DB if that ever matters.
	const notifiedReminders = new Set<number>()
	setInterval(() => {
		const now = Date.now()
		const reminderTasks = db
			.select({ id: tasks.id, name: tasks.name, reminder_at: tasks.reminderAt })
			.from(tasks)
			.where(sql`${tasks.reminderAt} is not null`)
			.all()
		for (const task of reminderTasks) {
			if (!task.reminder_at || notifiedReminders.has(task.id)) continue
			const remindAt = new Date(task.reminder_at).getTime()
			if (remindAt - now > 20_000 || remindAt - now <= -10_000) continue
			notifiedReminders.add(task.id)
			showTaskReminderNotification(task)
		}
	}, 20_000)
}

function showTaskReminderNotification(task: { id: number; name: string }) {
	const savedLang = db
		.select({ value: appMeta.value })
		.from(appMeta)
		.where(eq(appMeta.key, META_LANGUAGE_KEY))
		.get()?.value
	const isRu = savedLang === 'ru' || (!savedLang && app.getLocale().startsWith('ru'))
	const notification = new Notification({
		title: task.name,
		body: isRu ? '⏰ Напоминание' : '⏰ Reminder',
	})
	notification.on('click', () => {
		const win = BrowserWindow.getAllWindows()[0]
		if (!win) return
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
		win.webContents.send(IPC.NAVIGATE_TO_TASK, task.id)
	})
	notification.show()
}
