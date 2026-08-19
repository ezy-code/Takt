import { eq, isNull, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddItemPayload, UpdateItemPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import {
	getEntityAncestors,
	getEntityChildren,
	getItemsWithRate,
	getItemWithRate,
	searchEntities,
} from '../repositories/items'
import { items, timeEntries } from '../schema'
import { getDefaultStatusId } from './statuses'

function resolveMyDayDate(myDay?: boolean | string | null): string | null {
	if (myDay === true) return new Date().toISOString().split('T')[0]
	if (myDay === false || myDay === null) return null
	if (typeof myDay === 'string') return myDay
	return null
}

function entityExists(db: Db, id: number) {
	return db.select({ id: items.id }).from(items).where(eq(items.id, id)).get() != null
}

function isDescendant(db: Db, entityId: number, candidateParentId: number) {
	let parentId = candidateParentId
	const visited = new Set<number>()
	while (!visited.has(parentId)) {
		visited.add(parentId)
		if (parentId === entityId) return true
		const parent = db.select({ parentId: items.parentId }).from(items).where(eq(items.id, parentId)).get()
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

export function registerItemsHandlers(db: Db) {
	ipcMain.handle(IPC.GET_ITEMS, () => getItemsWithRate(db))

	ipcMain.handle(IPC.GET_ITEM, (_event, id: number) => getItemWithRate(db, id))

	ipcMain.handle(
		IPC.ADD_ITEM,
		(
			_event,
			{
				name,
				description,
				descriptionMd,
				descriptionHtml,
				statusId,
				parentId,
				groupId,
				myDay,
				reminderAt,
				hourlyRate,
				entityType,
			}: AddItemPayload,
		) => {
			const resolvedEntityType = entityType ?? 'task'
			if (!['task', 'note'].includes(resolvedEntityType)) throw new Error('Invalid entity type')
			validateParent(db, null, parentId)
			const resolvedStatusId = resolvedEntityType === 'task' ? (statusId ?? getDefaultStatusId(db)) : null
			if (resolvedEntityType === 'task' && resolvedStatusId == null) throw new Error('No statuses configured')
			const myDayDate = resolveMyDayDate(myDay)
			const maxPos = db
				.select({ maxPos: sql<number>`coalesce(max(${items.position}), -1)` })
				.from(items)
				.where(resolvedStatusId != null ? eq(items.statusId, resolvedStatusId) : isNull(items.statusId))
				.get()
			return db
				.insert(items)
				.values({
					name,
					description,
					descriptionMd: descriptionMd ?? '',
					descriptionHtml: descriptionHtml ?? '',
					statusId: resolvedStatusId,
					parentId: parentId ?? null,
					groupId: groupId ?? null,
					myDayDate,
					reminderAt: reminderAt ?? null,
					position: maxPos!.maxPos + 1,
					hourlyRate: hourlyRate ?? null,
					entityType: resolvedEntityType,
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		IPC.UPDATE_ITEM,
		(
			_event,
			{
				id,
				name,
				description,
				descriptionMd,
				descriptionHtml,
				statusId,
				parentId,
				groupId,
				myDay,
				reminderAt,
				hourlyRate,
				canvasX,
				canvasY,
				canvasWidth,
				canvasHeight,
				entityType,
			}: UpdateItemPayload,
		) => {
			const existing = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get()
			if (!existing) throw new Error('Entity not found')
			validateParent(db, id, parentId)
			const updates: Partial<typeof items.$inferInsert> = {}
			if (name !== undefined) updates.name = name
			if (description !== undefined) updates.description = description
			if (descriptionMd !== undefined) updates.descriptionMd = descriptionMd
			if (descriptionHtml !== undefined) updates.descriptionHtml = descriptionHtml
			if (statusId !== undefined) updates.statusId = statusId
			if (parentId !== undefined) updates.parentId = parentId
			if (groupId !== undefined) updates.groupId = groupId
			if (myDay !== undefined) updates.myDayDate = resolveMyDayDate(myDay)
			if (reminderAt !== undefined) updates.reminderAt = reminderAt
			if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate
			if (canvasX !== undefined) updates.canvasX = canvasX
			if (canvasY !== undefined) updates.canvasY = canvasY
			if (canvasWidth != null) updates.canvasWidth = canvasWidth
			if (canvasHeight != null) updates.canvasHeight = canvasHeight
			if (entityType !== undefined) {
				updates.entityType = entityType
				if (entityType !== 'task' && statusId === undefined) updates.statusId = null
			}
			return db.update(items).set(updates).where(eq(items.id, id)).returning().get()
		},
	)

	ipcMain.handle(IPC.GET_ENTITY_CHILDREN, (_event, parentId: number) => getEntityChildren(db, parentId))
	ipcMain.handle(IPC.GET_ENTITY_ANCESTORS, (_event, entityId: number) => getEntityAncestors(db, entityId))
	ipcMain.handle(IPC.SEARCH_ENTITIES, (_event, query: unknown, limit?: unknown) => searchEntities(db, query, limit))

	ipcMain.handle(IPC.DELETE_ITEM, (_event, id: number) => {
		db.delete(timeEntries).where(eq(timeEntries.itemId, id)).run()
		db.update(items).set({ parentId: null }).where(eq(items.parentId, id)).run()
		db.delete(items).where(eq(items.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.MOVE_ITEM, (_event, itemId: number, statusId: number) => {
		const existing = db.select({ entityType: items.entityType }).from(items).where(eq(items.id, itemId)).get()
		if (!existing) throw new Error('Item not found')
		if (existing.entityType !== 'task') throw new Error('Only items can have statuses')
		const maxPos = db
			.select({ maxPos: sql<number>`coalesce(max(${items.position}), -1)` })
			.from(items)
			.where(eq(items.statusId, statusId))
			.get()
		return db
			.update(items)
			.set({ statusId, position: maxPos!.maxPos + 1 })
			.where(eq(items.id, itemId))
			.returning()
			.get()
	})

	ipcMain.handle(IPC.REORDER_ITEMS, (_event, _columnId: number, orderedItemIds: number[]) => {
		db.transaction(() => {
			orderedItemIds.forEach((id, idx) => {
				db.update(items).set({ position: idx }).where(eq(items.id, id)).run()
			})
		})
		return { success: true }
	})

	ipcMain.handle(IPC.UPDATE_ITEM_CANVAS_POSITION, (_event, id: number, x: number, y: number) => {
		return db.update(items).set({ canvasX: x, canvasY: y }).where(eq(items.id, id)).returning().get()
	})
}
