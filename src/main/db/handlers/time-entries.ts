import { desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { UpdateTimeEntryPayload } from '../../../shared/api'
import { costOf } from '../../../shared/cost'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getDefaultRate } from '../meta'
import { getTasksWithRate } from '../repositories/tasks'
import { timeEntries } from '../schema'

export function registerTimeEntriesHandlers(db: Db) {
	ipcMain.handle(IPC.GET_ALL_TIME_ENTRIES, () => {
		const defaultRate = getDefaultRate()
		const entities = new Map(getTasksWithRate(db).map((task) => [task.id, task]))
		return db
			.select()
			.from(timeEntries)
			.orderBy(desc(timeEntries.id))
			.all()
			.map((entry) => {
				const task = entities.get(entry.taskId)
				const rate = task?.rate ?? defaultRate
				const rateSource = task?.rateSource ?? 'default'
				return {
					...entry,
					taskName: task?.name ?? '',
					parentId: task?.parentId ?? null,
					parentName: task?.parentName ?? null,
					rate,
					rateSource,
					cost: costOf(entry.duration ?? 0, rate),
				}
			})
	})

	ipcMain.handle(IPC.GET_TIME_SUMMARY, () => {
		const defaultRate = getDefaultRate()
		const entities = new Map(getTasksWithRate(db).map((task) => [task.id, task]))
		const rows = db.select().from(timeEntries).all()

		let totalDuration = 0
		let totalCost = 0
		let todayDuration = 0
		let todayCost = 0
		const now = new Date()
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
		const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()

		for (const row of rows) {
			const duration = row.duration ?? 0
			const rate = entities.get(row.taskId)?.rate ?? defaultRate
			const cost = costOf(duration, rate)
			totalDuration += duration
			totalCost += cost
			const startMs = new Date(row.startTime).getTime()
			if (startMs >= todayStart && startMs < todayEnd) {
				todayDuration += duration
				todayCost += cost
			}
		}

		return { totalSessions: rows.length, totalDuration, todayDuration, totalCost, todayCost }
	})

	ipcMain.handle(IPC.UPDATE_TIME_ENTRY, (_event, payload: UpdateTimeEntryPayload) => {
		const existing = db.select().from(timeEntries).where(eq(timeEntries.id, payload.id)).get()
		if (!existing) throw new Error('Time entry not found')
		if (existing.stopTime === null) throw new Error('Cannot edit an active time entry')

		const start = new Date(payload.startTime)
		if (payload.stopTime === null) throw new Error('Time entry stop time is required')
		const stop = new Date(payload.stopTime)
		if (!Number.isFinite(start.getTime()) || !Number.isFinite(stop.getTime())) {
			throw new Error('Invalid time entry date')
		}
		const durationMs = stop.getTime() - start.getTime()
		if (durationMs < 0) throw new Error('Time entry stop time cannot be earlier than start time')
		if (durationMs < 60_000) throw new Error('Time entry duration must be at least one minute')

		const entry = db
			.update(timeEntries)
			.set({
				startTime: start.toISOString(),
				stopTime: stop.toISOString(),
				duration: Math.floor(durationMs / 1000),
			})
			.where(eq(timeEntries.id, payload.id))
			.returning()
			.get()

		if (!entry) throw new Error('Time entry update failed')
		return entry
	})

	ipcMain.handle(IPC.DELETE_TIME_ENTRY, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
		return { success: true }
	})
}
