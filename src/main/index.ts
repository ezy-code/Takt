import { app, BrowserWindow, ipcMain, Menu, Notification, nativeImage, nativeTheme, Tray } from 'electron'
import { join } from 'path'
import { APP_NAME, AUTOSTART_ARG } from '../shared/constants'
import { formatDuration } from '../shared/formatDuration'
import { IPC } from '../shared/ipc'
import { initAutostart } from './autostart'
import { createDb, type Db } from './db'
import { getLastTimeEntry, getRecentTasks, startTimer, stopTimer } from './db/handlers/timer'
import { registerHandlers } from './db/registerHandlers'
import type { TimerChangeInfo } from './db/types'
import { getResourcePath } from './helpers'
import { initAppImageDesktopEntry } from './linuxDesktopEntry'
import { initUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let db: Db | null = null
let isTimerActive = false
let timerStartTime: string | null = null
let timerTaskName: string | null = null
let timerTaskId: number | null = null
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

		db = createDb(join(app.getPath('userData'), 'tasks.db'))
		registerHandlers(db, { onTimerChange: handleTimerChange })
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

function handleTimerChange(info: TimerChangeInfo) {
	if (info.active) {
		isTimerActive = true
		timerStartTime = info.startTime
		timerTaskName = info.taskName
		timerTaskId = info.taskId
		startTrayTimerUpdate()
	} else {
		isTimerActive = false
		timerStartTime = null
		timerTaskName = null
		timerTaskId = null
		stopTrayTimerUpdate()
	}
	updateTrayIcon()
	rebuildTrayMenu()
	BrowserWindow.getAllWindows()[0]?.webContents.send(IPC.TIMER_CHANGED)
}

function showMainWindow() {
	const win = BrowserWindow.getAllWindows()[0]
	if (win) {
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
	}
}

function continueLastTask() {
	if (!db) return
	const last = getLastTimeEntry(db)
	if (last) startTimer(db, last.entry.taskId, handleTimerChange)
}

function stopActiveTimer() {
	if (db && timerTaskId != null) stopTimer(db, timerTaskId, handleTimerChange)
}

function createTray() {
	const icon = nativeImage.createFromPath(getTrayIcon())
	tray = new Tray(icon)

	tray.setToolTip(APP_NAME)
	rebuildTrayMenu()
	tray.on('click', showMainWindow)
}

function rebuildTrayMenu() {
	if (!tray || !db) return
	tray.setContextMenu(buildTrayMenu())
}

function buildTrayMenu(): Menu {
	const template: Electron.MenuItemConstructorOptions[] = []

	if (isTimerActive) {
		template.push(
			{ label: `⏱ ${timerTaskName ?? ''}`, enabled: false },
			{ label: 'Stop timer', click: stopActiveTimer },
		)
	} else {
		const last = db ? getLastTimeEntry(db) : null
		if (last) template.push({ label: `Continue last task: ${last.task.name}`, click: continueLastTask })

		const dbRef = db
		if (dbRef) {
			const recent = getRecentTasks(dbRef)
			if (recent.length) {
				template.push({
					label: 'Start timer for…',
					submenu: recent.map((t) => ({ label: t.name, click: () => startTimer(dbRef, t.id, handleTimerChange) })),
				})
			}
		}
	}

	template.push({ type: 'separator' }, { label: 'Show Window', click: showMainWindow }, { type: 'separator' })

	template.push({
		label: isTimerActive ? 'Stop & Quit' : 'Quit',
		click: () => {
			stopActiveTimer()
			isQuitting = true
			app.quit()
		},
	})

	return Menu.buildFromTemplate(template)
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
