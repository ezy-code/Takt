import { app, ipcMain } from 'electron'
import { AUTOSTART_ARG } from '../shared/constants'
import { createLinuxAutostartEntry, deleteLinuxAutostartEntry, isLinuxAutostartEnabled } from './linuxDesktopEntry'

function enableAutostart() {
	if (process.platform === 'win32' || process.platform === 'darwin') {
		app.setLoginItemSettings({
			openAtLogin: true,
			openAsHidden: true,
			path: process.execPath,
			args: [AUTOSTART_ARG],
		})
	} else if (process.platform === 'linux') {
		createLinuxAutostartEntry()
	}
}

function disableAutostart() {
	if (process.platform === 'win32' || process.platform === 'darwin') {
		app.setLoginItemSettings({ openAtLogin: false })
	} else if (process.platform === 'linux') {
		deleteLinuxAutostartEntry()
	}
}

function isAutostartEnabled(): boolean {
	if (process.platform === 'win32' || process.platform === 'darwin') {
		return app.getLoginItemSettings().openAtLogin
	}
	return isLinuxAutostartEnabled()
}

export function initAutostart() {
	ipcMain.handle('get-autostart', () => isAutostartEnabled())
	ipcMain.handle('set-autostart', (_event, enabled: boolean) => {
		if (enabled) enableAutostart()
		else disableAutostart()
	})
}
