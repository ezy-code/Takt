import { desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { costOf } from '../../../shared/cost'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getDefaultRate } from '../meta'
import { resolveRate } from '../repositories/tasks'
import { projects, tasks, timeEntries } from '../schema'

export function registerTimeEntriesHandlers(db: Db) {
	ipcMain.handle(IPC.GET_ALL_TIME_ENTRIES, () => {
		const defaultRate = getDefaultRate()
		return db
			.select({
				id: timeEntries.id,
				taskId: timeEntries.taskId,
				taskName: tasks.name,
				projectId: tasks.projectId,
				projectName: projects.name,
				startTime: timeEntries.startTime,
				stopTime: timeEntries.stopTime,
				duration: timeEntries.duration,
				task_rate: tasks.hourly_rate,
				project_rate: projects.hourly_rate,
			})
			.from(timeEntries)
			.leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
			.leftJoin(projects, eq(tasks.projectId, projects.id))
			.orderBy(desc(timeEntries.startTime))
			.all()
			.map((e) => {
				const { rate, rateSource } = resolveRate(e.task_rate, e.project_rate, defaultRate)
				return {
					id: e.id,
					taskId: e.taskId,
					taskName: e.taskName ?? '',
					projectId: e.projectId,
					projectName: e.projectName,
					startTime: e.startTime,
					stopTime: e.stopTime,
					duration: e.duration,
					rate,
					rateSource,
					cost: costOf(e.duration ?? 0, rate),
				}
			})
	})

	ipcMain.handle(IPC.GET_TIME_SUMMARY, () => {
		const defaultRate = getDefaultRate()
		const rows = db
			.select({
				startTime: timeEntries.startTime,
				duration: timeEntries.duration,
				task_rate: tasks.hourly_rate,
				project_rate: projects.hourly_rate,
			})
			.from(timeEntries)
			.leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
			.leftJoin(projects, eq(tasks.projectId, projects.id))
			.all()

		let totalDuration = 0
		let totalCost = 0
		let todayDuration = 0
		let todayCost = 0
		const now = new Date()
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
		const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()

		for (const r of rows) {
			const { rate } = resolveRate(r.task_rate, r.project_rate, defaultRate)
			const duration = r.duration ?? 0
			const cost = costOf(duration, rate)
			totalDuration += duration
			totalCost += cost
			const startMs = new Date(r.startTime).getTime()
			if (startMs >= todayStart && startMs < todayEnd) {
				todayDuration += duration
				todayCost += cost
			}
		}

		return {
			totalSessions: rows.length,
			totalDuration,
			todayDuration,
			totalCost,
			todayCost,
		}
	})

	ipcMain.handle(IPC.DELETE_TIME_ENTRY, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
		return { success: true }
	})
}
