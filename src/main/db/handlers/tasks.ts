import { eq, or, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddTaskPayload, UpdateTaskPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getTasksWithRate, getTaskWithRate } from '../repositories/tasks'
import { taskLinks, tasks, timeEntries } from '../schema'
import { getDefaultStatusId } from './statuses'

function resolveMyDayDate(myDay?: boolean | string | null): string | null {
	if (myDay === true) return new Date().toISOString().split('T')[0]
	if (myDay === false || myDay === null) return null
	if (typeof myDay === 'string') return myDay
	return null
}

export function registerTasksHandlers(db: Db) {
	ipcMain.handle(IPC.GET_TASKS, () => getTasksWithRate(db))

	ipcMain.handle(IPC.GET_TASK, (_event, id: number) => getTaskWithRate(db, id))

	ipcMain.handle(
		IPC.ADD_TASK,
		(
			_event,
			{
				name,
				description,
				description_md,
				description_html,
				statusId,
				projectId,
				myDay,
				reminderAt,
				hourlyRate,
			}: AddTaskPayload,
		) => {
			const resolvedStatusId = statusId ?? getDefaultStatusId(db)
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
					hourly_rate: hourlyRate ?? null,
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		IPC.UPDATE_TASK,
		(
			_event,
			{
				id,
				name,
				description,
				description_md,
				description_html,
				statusId,
				projectId,
				myDay,
				reminderAt,
				hourlyRate,
			}: UpdateTaskPayload,
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
				hourly_rate?: number | null
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
			if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate
			return db.update(tasks).set(updates).where(eq(tasks.id, id)).returning().get()
		},
	)

	ipcMain.handle(IPC.DELETE_TASK, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.taskId, id)).run()
		db.delete(taskLinks)
			.where(or(eq(taskLinks.sourceTaskId, id), eq(taskLinks.targetTaskId, id)))
			.run()
		db.delete(tasks).where(eq(tasks.id, id)).run()
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
}
