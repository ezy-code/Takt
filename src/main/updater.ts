import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log/main'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import type { UpdaterState } from '../shared/updater'

let state: UpdaterState = {
	status: 'idle',
	currentVersion: app.getVersion(),
}

function broadcast(): void {
	for (const win of BrowserWindow.getAllWindows()) {
		win.webContents.send('updater:status', state)
	}
}

function setState(partial: Partial<UpdaterState>): UpdaterState {
	state = { ...state, ...partial }
	broadcast()
	return state
}

export function initUpdater({ checkOnStart = false }: { checkOnStart?: boolean } = {}): void {
	autoUpdater.logger = log
	autoUpdater.autoDownload = false

	autoUpdater.on('checking-for-update', () => setState({ status: 'checking' }))

	autoUpdater.on('update-available', (info: UpdateInfo) =>
		setState({ status: 'available', latestVersion: info.version }),
	)

	autoUpdater.on('update-not-available', () => setState({ status: 'not-available' }))

	autoUpdater.on('download-progress', (progressObj: ProgressInfo) =>
		setState({
			status: 'downloading',
			progress: {
				percent: progressObj.percent,
				transferred: progressObj.transferred,
				total: progressObj.total,
				bytesPerSecond: progressObj.bytesPerSecond,
			},
		}),
	)

	autoUpdater.on('update-downloaded', (info: UpdateInfo) =>
		setState({ status: 'downloaded', latestVersion: info.version }),
	)

	autoUpdater.on('error', (err: Error) => setState({ status: 'error', error: err.message }))

	ipcMain.handle('updater:get-state', () => state)

	ipcMain.handle('updater:check', () => {
		if (!app.isPackaged) {
			return setState({ status: 'error', error: 'Updates are only available in packaged builds' })
		}
		if (state.status === 'checking' || state.status === 'downloading' || state.status === 'downloaded') {
			return state
		}
		autoUpdater.checkForUpdates().catch(() => {})
		return state
	})

	ipcMain.handle('updater:download', () => {
		if (state.status === 'available') {
			setState({ status: 'downloading', progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 } })
			autoUpdater.downloadUpdate().catch(() => {})
		}
		return state
	})

	ipcMain.handle('updater:install', () => {
		autoUpdater.quitAndInstall()
		return { success: true }
	})

	if (checkOnStart && app.isPackaged) {
		autoUpdater.checkForUpdates().catch(() => {})
	}
}
