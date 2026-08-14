import { eq, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddCanvasGroupPayload, UpdateCanvasGroupPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { canvasGroups, tasks } from '../schema'

export function registerCanvasGroupsHandlers(db: Db) {
	ipcMain.handle(IPC.GET_CANVAS_GROUPS, () => {
		return db.select().from(canvasGroups).all()
	})

	ipcMain.handle(IPC.ADD_CANVAS_GROUP, (_event, payload: AddCanvasGroupPayload) => {
		return db
			.insert(canvasGroups)
			.values({
				name: payload.name ?? 'Group',
				canvasX: payload.canvasX ?? 100,
				canvasY: payload.canvasY ?? 100,
				width: payload.width ?? 320,
				height: payload.height ?? 220,
				color: payload.color ?? '#868e96',
			})
			.returning()
			.get()
	})

	ipcMain.handle(IPC.UPDATE_CANVAS_GROUP, (_event, { id, ...rest }: UpdateCanvasGroupPayload) => {
		const updates: Partial<typeof canvasGroups.$inferInsert> = {}
		if (rest.name !== undefined) updates.name = rest.name
		if (rest.canvasX !== undefined) updates.canvasX = rest.canvasX
		if (rest.canvasY !== undefined) updates.canvasY = rest.canvasY
		if (rest.width !== undefined) updates.width = rest.width
		if (rest.height !== undefined) updates.height = rest.height
		if (rest.color !== undefined) updates.color = rest.color
		return db.update(canvasGroups).set(updates).where(eq(canvasGroups.id, id)).returning().get()
	})

	ipcMain.handle(IPC.DELETE_CANVAS_GROUP, (_event, id: number) => {
		db.transaction(() => {
			const group = db.select().from(canvasGroups).where(eq(canvasGroups.id, id)).get()
			if (group) {
				// grouped tasks store canvas coords relative to their group; convert to absolute
				db.update(tasks)
					.set({
						canvasX: sql`coalesce(${tasks.canvasX}, 0) + ${group.canvasX ?? 0}`,
						canvasY: sql`coalesce(${tasks.canvasY}, 0) + ${group.canvasY ?? 0}`,
					})
					.where(eq(tasks.groupId, id))
					.run()
			}
			db.delete(canvasGroups).where(eq(canvasGroups.id, id)).run()
		})
		return { success: true }
	})
}
