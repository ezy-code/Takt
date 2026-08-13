import { desc, eq, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getTaskForTimer } from '../repositories/tasks'
import { tasks, timeEntries } from '../schema'
import type { OnTimerChange } from '../types'

export function registerTimerHandlers(db: Db, onTimerChange?: OnTimerChange) {
	const initialActive = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (initialActive) {
		const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, initialActive.taskId)).get()
		onTimerChange?.({ active: true, startTime: initialActive.startTime, taskName: task?.name ?? 'Unknown' })
	} else {
		onTimerChange?.({ active: false })
	}

	ipcMain.handle(IPC.GET_ACTIVE_TIMER, () => {
		const entry = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (!entry) return null

		const task = getTaskForTimer(db, entry.taskId)

		return { entry, task }
	})

	ipcMain.handle(IPC.GET_LAST_TIMER, () => {
		const entry = db.select().from(timeEntries).orderBy(desc(timeEntries.startTime)).limit(1).all()[0]

		if (!entry) return null

		const task = getTaskForTimer(db, entry.taskId)
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
		return { conflict: false, entry, task: getTaskForTimer(db, taskId) }
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
		return { entry, task: getTaskForTimer(db, taskId) }
	})
}
