import { eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getMyDayTasksWithRate } from '../repositories/tasks'
import { tasks } from '../schema'

export function registerMyDayHandlers(db: Db) {
	ipcMain.handle(IPC.TOGGLE_MY_DAY, (_event, id: number) => {
		const task = db.select({ my_day_date: tasks.my_day_date }).from(tasks).where(eq(tasks.id, id)).get()
		const newDate =
			task?.my_day_date === new Date().toISOString().split('T')[0] ? null : new Date().toISOString().split('T')[0]
		db.update(tasks).set({ my_day_date: newDate }).where(eq(tasks.id, id)).run()
		return { success: true }
	})

	ipcMain.handle(IPC.GET_MY_DAY_TASKS, () => getMyDayTasksWithRate(db))

	ipcMain.handle(IPC.CLEAR_MY_DAY, (_event, id: number) => {
		db.update(tasks).set({ my_day_date: null }).where(eq(tasks.id, id)).run()
		return { success: true }
	})
}
