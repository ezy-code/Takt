import { desc, eq, max, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { ActiveTimerInfo } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getTaskForTimer } from '../repositories/tasks'
import { tasks, timeEntries } from '../schema'
import type { OnTimerChange } from '../types'

export function getLastTimeEntry(db: Db): ActiveTimerInfo | null {
	const entry = db.select().from(timeEntries).orderBy(desc(timeEntries.startTime)).limit(1).all()[0]

	if (!entry) return null

	const task = getTaskForTimer(db, entry.taskId)
	if (!task) return null

	return { entry, task }
}

export function getRecentTasks(db: Db, limit = 5) {
	return db
		.select({ id: tasks.id, name: tasks.name })
		.from(timeEntries)
		.innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
		.groupBy(tasks.id)
		.orderBy(desc(max(timeEntries.startTime)))
		.limit(limit)
		.all()
}

export function startTimer(db: Db, taskId: number, onTimerChange?: OnTimerChange) {
	const active = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (active) {
		const activeTask = db.select().from(tasks).where(eq(tasks.id, active.taskId)).get()
		return { conflict: true, activeEntry: active, activeTask }
	}

	const now = new Date().toISOString()
	const entry = db.insert(timeEntries).values({ taskId, startTime: now }).returning().get()

	const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, taskId)).get()
	onTimerChange?.({ active: true, startTime: now, taskName: task?.name ?? 'Unknown', taskId })
	return { conflict: false, entry, task: getTaskForTimer(db, taskId) }
}

export function stopTimer(db: Db, taskId: number, onTimerChange?: OnTimerChange) {
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
	return { entry, task: getTaskForTimer(db, taskId) }
}

export function registerTimerHandlers(db: Db, onTimerChange?: OnTimerChange) {
	const initialActive = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (initialActive) {
		const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, initialActive.taskId)).get()
		onTimerChange?.({
			active: true,
			startTime: initialActive.startTime,
			taskName: task?.name ?? 'Unknown',
			taskId: initialActive.taskId,
		})
	} else {
		onTimerChange?.({ active: false })
	}

	ipcMain.handle(IPC.GET_ACTIVE_TIMER, () => {
		const entry = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (!entry) return null

		const task = getTaskForTimer(db, entry.taskId)

		return { entry, task }
	})

	ipcMain.handle(IPC.GET_LAST_TIMER, () => getLastTimeEntry(db))

	ipcMain.handle(IPC.START_TIMER, (_event, taskId: number) => startTimer(db, taskId, onTimerChange))

	ipcMain.handle(IPC.STOP_TIMER, (_event, taskId: number) => stopTimer(db, taskId, onTimerChange))
}
