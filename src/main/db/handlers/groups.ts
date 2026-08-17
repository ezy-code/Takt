import { eq, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddGroupPayload, UpdateGroupPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { groups, tasks } from '../schema'

export function registerGroupsHandlers(db: Db) {
	ipcMain.handle(IPC.GET_GROUPS, () => {
		return db.select().from(groups).all()
	})

	ipcMain.handle(IPC.ADD_GROUP, (_event, payload: AddGroupPayload) => {
		return db
			.insert(groups)
			.values({
				name: payload.name ?? 'Group',
				canvasX: payload.canvasX ?? 100,
				canvasY: payload.canvasY ?? 100,
				width: payload.width ?? 320,
				height: payload.height ?? 220,
				color: payload.color ?? '#868e96',
				parentId: payload.parentId ?? null,
			})
			.returning()
			.get()
	})

	ipcMain.handle(IPC.UPDATE_GROUP, (_event, { id, ...rest }: UpdateGroupPayload) => {
		const updates: Partial<typeof groups.$inferInsert> = {}
		if (rest.name !== undefined) updates.name = rest.name
		if (rest.canvasX !== undefined) updates.canvasX = rest.canvasX
		if (rest.canvasY !== undefined) updates.canvasY = rest.canvasY
		if (rest.width !== undefined) updates.width = rest.width
		if (rest.height !== undefined) updates.height = rest.height
		if (rest.color !== undefined) updates.color = rest.color
		if (rest.parentId !== undefined) updates.parentId = rest.parentId
		return db.update(groups).set(updates).where(eq(groups.id, id)).returning().get()
	})

	ipcMain.handle(IPC.DELETE_GROUP, (_event, id: number) => {
		db.transaction(() => {
			const group = db.select().from(groups).where(eq(groups.id, id)).get()
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
			db.delete(groups).where(eq(groups.id, id)).run()
		})
		return { success: true }
	})
}
