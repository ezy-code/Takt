import { eq, isNull, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddTaskPayload, UpdateTaskPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import {
	getEntityAncestors,
	getEntityChildren,
	getTasksWithRate,
	getTaskWithRate,
	searchEntities,
} from '../repositories/tasks'
import { tasks, timeEntries } from '../schema'
import { getDefaultStatusId } from './statuses'

function resolveMyDayDate(myDay?: boolean | string | null): string | null {
	if (myDay === true) return new Date().toISOString().split('T')[0]
	if (myDay === false || myDay === null) return null
	if (typeof myDay === 'string') return myDay
	return null
}

function entityExists(db: Db, id: number) {
	return db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id)).get() != null
}

function isDescendant(db: Db, entityId: number, candidateParentId: number) {
	let parentId = candidateParentId
	const visited = new Set<number>()
	while (!visited.has(parentId)) {
		visited.add(parentId)
		if (parentId === entityId) return true
		const parent = db.select({ parentId: tasks.parentId }).from(tasks).where(eq(tasks.id, parentId)).get()
		if (parent?.parentId == null) return false
		parentId = parent.parentId
	}
	return true
}

function validateParent(db: Db, entityId: number | null, parentId: number | null | undefined) {
	if (parentId === undefined || parentId === null) return
	if (!entityExists(db, parentId)) throw new Error('Parent entity not found')
	if (entityId != null && (entityId === parentId || isDescendant(db, entityId, parentId))) {
		throw new Error('Cannot create a parent cycle')
	}
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
				parentId,
				groupId,
				myDay,
				reminderAt,
				hourlyRate,
				entityType,
			}: AddTaskPayload,
		) => {
			const resolvedEntityType = entityType ?? 'task'
			if (!['task', 'note'].includes(resolvedEntityType)) throw new Error('Invalid entity type')
			validateParent(db, null, parentId)
			const resolvedStatusId = resolvedEntityType === 'task' ? (statusId ?? getDefaultStatusId(db)) : null
			if (resolvedEntityType === 'task' && resolvedStatusId == null) throw new Error('No statuses configured')
			const my_day_date = resolveMyDayDate(myDay)
			const maxPos = db
				.select({ maxPos: sql<number>`coalesce(max(${tasks.position}), -1)` })
				.from(tasks)
				.where(resolvedStatusId != null ? eq(tasks.statusId, resolvedStatusId) : isNull(tasks.statusId))
				.get()
			return db
				.insert(tasks)
				.values({
					name,
					description,
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
					statusId: resolvedStatusId,
					parentId: parentId ?? null,
					groupId: groupId ?? null,
					my_day_date,
					reminderAt: reminderAt ?? null,
					position: maxPos!.maxPos + 1,
					hourly_rate: hourlyRate ?? null,
					entityType: resolvedEntityType,
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
				parentId,
				groupId,
				myDay,
				reminderAt,
				hourlyRate,
				canvasX,
				canvasY,
				entityType,
			}: UpdateTaskPayload,
		) => {
			const existing = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id)).get()
			if (!existing) throw new Error('Entity not found')
			validateParent(db, id, parentId)
			const updates: Partial<typeof tasks.$inferInsert> = {}
			if (name !== undefined) updates.name = name
			if (description !== undefined) updates.description = description
			if (description_md !== undefined) updates.descriptionMarkdown = description_md
			if (description_html !== undefined) updates.descriptionHtml = description_html
			if (statusId !== undefined) updates.statusId = statusId
			if (parentId !== undefined) updates.parentId = parentId
			if (groupId !== undefined) updates.groupId = groupId
			if (myDay !== undefined) updates.my_day_date = resolveMyDayDate(myDay)
			if (reminderAt !== undefined) updates.reminderAt = reminderAt
			if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate
			if (canvasX !== undefined) updates.canvasX = canvasX
			if (canvasY !== undefined) updates.canvasY = canvasY
			if (entityType !== undefined) {
				updates.entityType = entityType
				if (entityType !== 'task' && statusId === undefined) updates.statusId = null
			}
			return db.update(tasks).set(updates).where(eq(tasks.id, id)).returning().get()
		},
	)

	ipcMain.handle(IPC.GET_ENTITY_CHILDREN, (_event, parentId: number) => getEntityChildren(db, parentId))
	ipcMain.handle(IPC.GET_ENTITY_ANCESTORS, (_event, entityId: number) => getEntityAncestors(db, entityId))
	ipcMain.handle(IPC.SEARCH_ENTITIES, (_event, query: unknown, limit?: unknown) => searchEntities(db, query, limit))

	ipcMain.handle(IPC.DELETE_TASK, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.taskId, id)).run()
		db.update(tasks).set({ parentId: null }).where(eq(tasks.parentId, id)).run()
		db.delete(tasks).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.MOVE_TASK, (_event, taskId: number, statusId: number) => {
		const existing = db.select({ entityType: tasks.entityType }).from(tasks).where(eq(tasks.id, taskId)).get()
		if (!existing) throw new Error('Task not found')
		if (existing.entityType !== 'task') throw new Error('Only tasks can have statuses')
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
