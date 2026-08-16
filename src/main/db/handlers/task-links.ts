import { and, eq, or } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { RelatedEntity, Task } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getTaskWithRate } from '../repositories/tasks'
import { taskLinks, tasks } from '../schema'

function isAncestor(db: Db, ancestorId: number, entityId: number) {
	let currentId: number | null = entityId
	const visited = new Set<number>()
	while (currentId != null && !visited.has(currentId)) {
		visited.add(currentId)
		const current = db.select({ parentId: tasks.parentId }).from(tasks).where(eq(tasks.id, currentId)).get()
		if (!current?.parentId) return false
		if (current.parentId === ancestorId) return true
		currentId = current.parentId
	}
	return false
}

export function registerTaskLinksHandlers(db: Db) {
	ipcMain.handle(IPC.GET_TASK_LINKS, () => {
		return db.select().from(taskLinks).all()
	})

	ipcMain.handle(IPC.GET_TASK_RELATED_ITEMS, (_event, taskId: number) => {
		const links = db
			.select()
			.from(taskLinks)
			.where(or(eq(taskLinks.sourceTaskId, taskId), eq(taskLinks.targetTaskId, taskId)))
			.all()
		const related: RelatedEntity[] = []
		for (const link of links) {
			const linkedId = link.sourceTaskId === taskId ? link.targetTaskId : link.sourceTaskId
			const task: Task | null = getTaskWithRate(db, linkedId)
			if (task) related.push(Object.assign({}, task, { linkId: link.id }))
		}
		return related
	})

	ipcMain.handle(IPC.ADD_TASK_LINK, (_event, sourceTaskId: number, targetTaskId: number) => {
		if (sourceTaskId === targetTaskId) throw new Error('Cannot link task to itself')
		const source = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, sourceTaskId)).get()
		const target = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, targetTaskId)).get()
		if (!source || !target) throw new Error('Task not found')
		if (isAncestor(db, sourceTaskId, targetTaskId) || isAncestor(db, targetTaskId, sourceTaskId)) {
			throw new Error('Parent and child entities cannot also be related')
		}
		const existing = db
			.select({ id: taskLinks.id })
			.from(taskLinks)
			.where(
				or(
					and(eq(taskLinks.sourceTaskId, sourceTaskId), eq(taskLinks.targetTaskId, targetTaskId)),
					and(eq(taskLinks.sourceTaskId, targetTaskId), eq(taskLinks.targetTaskId, sourceTaskId)),
				),
			)
			.get()
		if (existing) throw new Error('Tasks are already linked')
		const [canonicalSource, canonicalTarget] = [sourceTaskId, targetTaskId].sort((a, b) => a - b)
		return db
			.insert(taskLinks)
			.values({ sourceTaskId: canonicalSource, targetTaskId: canonicalTarget })
			.returning()
			.get()
	})

	ipcMain.handle(IPC.DELETE_TASK_LINK, (_event, id: number) => {
		db.delete(taskLinks).where(eq(taskLinks.id, id)).run()
		return { success: true }
	})
}
