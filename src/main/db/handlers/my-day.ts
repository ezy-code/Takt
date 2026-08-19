import { eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getMyDayItemsWithRate } from '../repositories/items'
import { items } from '../schema'

export function registerMyDayHandlers(db: Db) {
	ipcMain.handle(IPC.TOGGLE_MY_DAY, (_event, id: number) => {
		const item = db.select({ myDayDate: items.myDayDate }).from(items).where(eq(items.id, id)).get()
		const newDate =
			item?.myDayDate === new Date().toISOString().split('T')[0] ? null : new Date().toISOString().split('T')[0]
		db.update(items).set({ myDayDate: newDate }).where(eq(items.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.GET_MY_DAY_ITEMS, () => getMyDayItemsWithRate(db))

	ipcMain.handle(IPC.CLEAR_MY_DAY, (_event, id: number) => {
		db.update(items).set({ myDayDate: null }).where(eq(items.id, id)).run()
		return { success: true }
	})
}
