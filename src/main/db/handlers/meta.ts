import { ipcMain } from 'electron'
import { IPC } from '../../../shared/ipc'
import { getMeta, setMeta } from '../meta'

export function registerMetaHandlers() {
	ipcMain.handle(IPC.GET_META, (_event, key: string) => getMeta(key))

	ipcMain.handle(IPC.SET_META, (_event, key: string, value: string) => {
		setMeta(key, value)
		return { success: true }
	})
}
