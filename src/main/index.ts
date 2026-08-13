import { app, BrowserWindow, ipcMain, Menu, Notification, nativeImage, nativeTheme, Tray } from 'electron'
import { join } from 'path'
import { APP_NAME, AUTOSTART_ARG } from '../shared/constants'
import { formatDuration } from '../shared/formatDuration'
import { IPC } from '../shared/ipc'
import { initAutostart } from './autostart'
import { createDb } from './db'
import { registerHandlers } from './db/registerHandlers'
import type { TimerChangeInfo } from './db/types'
import { getResourcePath } from './helpers'
import { initAppImageDesktopEntry } from './linuxDesktopEntry'
import { initUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let isTimerActive = false
let timerStartTime: string | null = null
let timerTaskName: string | null = null
let trayTimerInterval: ReturnType<typeof setInterval> | null = null

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
	app.exit(0)
} else {
	app.on('second-instance', (_event, commandLine) => {
		if (commandLine.includes(AUTOSTART_ARG)) {
			return
		}

		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore()
			}

			mainWindow.show()
			mainWindow.focus()
		}
	})

	app.whenReady().then(() => {
		initAutostart()

		if (process.platform === 'linux') {
			app.setDesktopName(app.getName() + '.desktop')
		}

		initUpdater({ checkOnStart: app.isPackaged })

		const db = createDb(join(app.getPath('userData'), 'tasks.db'))
		registerHandlers(db, {
			onTimerChange: (info: TimerChangeInfo) => {
				if (info.active) {
					isTimerActive = true
					timerStartTime = info.startTime
					timerTaskName = info.taskName
					startTrayTimerUpdate()
				} else {
					isTimerActive = false
					timerStartTime = null
					timerTaskName = null
					stopTrayTimerUpdate()
				}
				updateTrayIcon()
			},
		})
		initAppImageDesktopEntry()
		createWindow()
		if (process.argv.includes(AUTOSTART_ARG)) mainWindow?.hide()
		createTray()

		nativeTheme.on('updated', updateTrayIcon)

		app.on('activate', () => {
			if (!mainWindow) {
				createWindow()
			} else {
				mainWindow.show()
				mainWindow.focus()
			}
		})
	})
}

function getTrayIcon(): string {
	const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
	const suffix = isTimerActive ? '-active' : ''
	return getResourcePath(`icon-${theme}${suffix}.png`)
}

function startTrayTimerUpdate() {
	stopTrayTimerUpdate()
	const update = () => {
		if (!timerStartTime || !timerTaskName) return
		const elapsed = Math.floor((Date.now() - new Date(timerStartTime).getTime()) / 1000)
		tray?.setToolTip(`⏱ ${timerTaskName} — ${formatDuration(elapsed)}`)
	}
	update()
	trayTimerInterval = setInterval(update, 1000)
}

function stopTrayTimerUpdate() {
	if (trayTimerInterval) {
		clearInterval(trayTimerInterval)
		trayTimerInterval = null
	}
	tray?.setToolTip(APP_NAME)
}

function createTray() {
	const icon = nativeImage.createFromPath(getTrayIcon())
	tray = new Tray(icon)

	const showWindow = () => {
		const win = BrowserWindow.getAllWindows()[0]
		if (win) {
			if (win.isMinimized()) win.restore()
			win.show()
			win.focus()
		}
	}

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show Window',
			click: showWindow,
		},
		{ type: 'separator' },
		{
			label: 'Quit',
			click: () => {
				isQuitting = true
				app.quit()
			},
		},
	])

	tray.setToolTip(APP_NAME)
	tray.setContextMenu(contextMenu)
	tray.on('click', showWindow)
}

function updateTrayIcon() {
	if (tray) {
		tray.setImage(nativeImage.createFromPath(getTrayIcon()))
	}
}

function createWindow() {
	if (!process.env['ELECTRON_RENDERER_URL']) {
		Menu.setApplicationMenu(null)
	}
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		icon: nativeImage.createFromPath(getResourcePath('app-icon.png')),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: false,
		},
	})

	mainWindow.on('close', (event) => {
		if (!isQuitting) {
			event.preventDefault()
			mainWindow?.hide()
		}
	})

	if (process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}
}

ipcMain.handle(IPC.SHOW_NOTIFICATION, (_event, title: string, body: string) => {
	new Notification({ title, body }).show()
})

app.commandLine.appendSwitch('in-process-gpu')

app.on('before-quit', () => {
	isQuitting = true
})
