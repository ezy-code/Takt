import { eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { taskLinks } from '../schema'

export function registerTaskLinksHandlers(db: Db) {
	ipcMain.handle(IPC.GET_TASK_LINKS, () => {
		return db.select().from(taskLinks).all()
	})

	ipcMain.handle(IPC.ADD_TASK_LINK, (_event, sourceTaskId: number, targetTaskId: number) => {
		return db.insert(taskLinks).values({ sourceTaskId, targetTaskId }).onConflictDoNothing().returning().get()
	})

	ipcMain.handle(IPC.DELETE_TASK_LINK, (_event, id: number) => {
		db.delete(taskLinks).where(eq(taskLinks.id, id)).run()
		return { success: true }
	})
}
