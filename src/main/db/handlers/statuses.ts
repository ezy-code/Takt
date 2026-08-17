import { asc, eq, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { items, statuses } from '../schema'

export function getDefaultStatusId(db: Db): number | undefined {
	const defaultStatus = db.select({ id: statuses.id }).from(statuses).where(eq(statuses.is_default, true)).get()
	if (defaultStatus) return defaultStatus.id
	const first = db.select({ id: statuses.id }).from(statuses).orderBy(asc(statuses.position)).limit(1).get()
	return first?.id
}

export function registerStatusesHandlers(db: Db) {
	ipcMain.handle(IPC.GET_STATUSES, () => {
		return db.select().from(statuses).orderBy(asc(statuses.position)).all()
	})

	ipcMain.handle(IPC.ADD_STATUS, (_event, name: string, color: string) => {
		const maxPos = db
			.select({ maxPos: sql<number>`coalesce(max(${statuses.position}), -1)` })
			.from(statuses)
			.get()
		return db
			.insert(statuses)
			.values({ name, color, position: maxPos!.maxPos + 1 })
			.returning()
			.get()
	})

	ipcMain.handle(IPC.UPDATE_STATUS, (_event, id: number, name: string, color: string) => {
		return db.update(statuses).set({ name, color }).where(eq(statuses.id, id)).returning().get()
	})

	ipcMain.handle(IPC.SET_DEFAULT_STATUS, (_event, id: number) => {
		db.transaction(() => {
			db.update(statuses).set({ is_default: false }).run()
			db.update(statuses).set({ is_default: true }).where(eq(statuses.id, id)).run()
		})
		return db.select().from(statuses).where(eq(statuses.id, id)).get()
	})

	ipcMain.handle(IPC.DELETE_STATUS, (_event, id: number) => {
		const itemCount = db.select({ cnt: sql<number>`count(*)` }).from(items).where(eq(items.statusId, id)).get()
		if (itemCount!.cnt > 0) return { success: false, reason: 'Has items' }
		const status = db.select({ is_default: statuses.is_default }).from(statuses).where(eq(statuses.id, id)).get()
		db.delete(statuses).where(eq(statuses.id, id)).run()
		if (status?.is_default) {
			const next = db.select({ id: statuses.id }).from(statuses).orderBy(asc(statuses.position)).limit(1).get()
			if (next) db.update(statuses).set({ is_default: true }).where(eq(statuses.id, next.id)).run()
		}
		return { success: true }
	})

	ipcMain.handle(IPC.REORDER_STATUSES, (_event, ids: number[]) => {
		db.transaction(() => {
			ids.forEach((id, idx) => {
				db.update(statuses).set({ position: idx }).where(eq(statuses.id, id)).run()
			})
		})
		return { success: true }
	})
}
