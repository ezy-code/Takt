import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { app, BrowserWindow, ipcMain, Menu, Notification, nativeImage, nativeTheme, powerMonitor, Tray } from 'electron'
import { join } from 'path'
import { APP_NAME, AUTOSTART_ARG, META_TIMER_AUTO_RESUME_KEY, META_TIMER_AUTO_STOP_KEY } from '../shared/constants'
import { formatDuration } from '../shared/formatDuration'
import { IPC } from '../shared/ipc'
import { initAutostart } from './autostart'
import { createDb, type Db } from './db'
import { getLastTimeEntry, getRecentItems, startTimer, stopTimer } from './db/handlers/timer'
import { getMeta } from './db/meta'
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
let timerItemName: string | null = null
let timerItemId: number | null = null
let trayTimerInterval: ReturnType<typeof setInterval> | null = null
let autoStoppedItemId: number | null = null
let linuxSessionId: string | null = null
let lockCheckInFlight = false

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

		const dbFile = app.isPackaged ? 'takt.db' : 'takt-dev.db'
		db = createDb(join(app.getPath('userData'), dbFile))
		registerHandlers(db, { onTimerChange: handleTimerChange })
		initAppImageDesktopEntry()
		createWindow()
		if (process.argv.includes(AUTOSTART_ARG)) mainWindow?.hide()
		createTray()

		nativeTheme.on('updated', updateTrayIcon)

		powerMonitor.on('suspend', handleIdleStart)
		powerMonitor.on('lock-screen', handleIdleStart)
		powerMonitor.on('resume', onResume)
		powerMonitor.on('unlock-screen', handleIdleEnd)
		initLinuxLockDetection()

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
		if (!timerStartTime || !timerItemName) return
		const elapsed = Math.floor((Date.now() - new Date(timerStartTime).getTime()) / 1000)
		tray?.setToolTip(`⏱ ${timerItemName} — ${formatDuration(elapsed)}`)
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
		timerItemName = info.itemName
		timerItemId = info.itemId
		startTrayTimerUpdate()
	} else {
		isTimerActive = false
		timerStartTime = null
		timerItemName = null
		timerItemId = null
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

function continueLastItem() {
	if (!db) return
	const last = getLastTimeEntry(db)
	if (last) startTimer(db, last.entry.itemId, handleTimerChange)
}

function stopActiveTimer() {
	if (db && timerItemId != null) stopTimer(db, timerItemId, handleTimerChange)
}

function handleIdleStart() {
	if (!db || !isTimerActive || timerItemId == null) return
	if (getMeta(META_TIMER_AUTO_STOP_KEY) !== '1') return
	const itemId = timerItemId
	stopTimer(db, itemId, handleTimerChange)
	autoStoppedItemId = itemId
}

function handleIdleEnd() {
	if (autoStoppedItemId == null) return
	const itemId = autoStoppedItemId
	autoStoppedItemId = null
	if (getMeta(META_TIMER_AUTO_RESUME_KEY) === '1' && db) {
		startTimer(db, itemId, handleTimerChange)
	}
	BrowserWindow.getAllWindows()[0]?.webContents.send(IPC.TIMER_CHANGED)
}

function onResume() {
	// Linux: after wake the screen may still be locked — defer to the lock poll.
	if (process.platform === 'linux' && autoStoppedItemId != null) {
		pollLinuxLock()
		return
	}
	handleIdleEnd()
}

function pollLinuxLock() {
	if (lockCheckInFlight || !linuxSessionId) return
	lockCheckInFlight = true
	execFile('loginctl', ['show-session', linuxSessionId, '-p', 'LockedHint', '--value'], (err, stdout) => {
		lockCheckInFlight = false
		if (err) return
		const value = stdout.trim()
		if (value === 'yes') {
			handleIdleStart()
		} else if (value === 'no' && autoStoppedItemId != null) {
			handleIdleEnd()
		}
	})
}

function readLinuxSessionId(): string | null {
	try {
		return readFileSync('/proc/self/sessionid', 'utf-8').trim() || null
	} catch {
		return null
	}
}

function initLinuxLockDetection() {
	if (process.platform !== 'linux') return
	linuxSessionId = process.env['XDG_SESSION_ID'] ?? readLinuxSessionId()
	if (!linuxSessionId) return // ponytail: no logind session id, rely on suspend/resume only
	setInterval(() => {
		if (isTimerActive || autoStoppedItemId != null) pollLinuxLock()
	}, 5000)
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
			{ label: `⏱ ${timerItemName ?? ''}`, enabled: false },
			{ label: 'Stop timer', click: stopActiveTimer },
		)
	} else {
		const last = db ? getLastTimeEntry(db) : null
		if (last) template.push({ label: `Continue last task: ${last.item.name}`, click: continueLastItem })

		const dbRef = db
		if (dbRef) {
			const recent = getRecentItems(dbRef)
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
