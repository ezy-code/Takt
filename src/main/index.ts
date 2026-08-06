import { app, BrowserWindow, ipcMain, Menu, Notification, nativeImage, nativeTheme, Tray } from 'electron'
import { join } from 'path'
import { APP_NAME } from '../shared/constants'
import { initAutostart } from './autostart'
import type { TimerChangeInfo } from './database'
import { initDatabase } from './database'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let isTimerActive = false
let timerStartTime: string | null = null
let timerTaskName: string | null = null
let trayTimerInterval: ReturnType<typeof setInterval> | null = null

function getResourcePath(rel: string): string {
	const base = app.isPackaged ? join(process.resourcesPath, 'resources') : join(__dirname, '../../resources')
	return join(base, rel)
}

function getTrayIcon(): string {
	const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
	const suffix = isTimerActive ? '-active' : ''
	return getResourcePath(`icon-${theme}${suffix}.png`)
}

function formatDuration(seconds: number): string {
	if (seconds <= 0) return '0:00'
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
	return `${m}:${String(s).padStart(2, '0')}`
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

ipcMain.handle('show-notification', (_event, title: string, body: string) => {
	new Notification({ title, body }).show()
})

app.commandLine.appendSwitch('in-process-gpu')

app.whenReady().then(() => {
	initAutostart()
	initDatabase((info: TimerChangeInfo) => {
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
	})
	createWindow()
	if (process.argv.includes('--hidden')) mainWindow?.hide()
	createTray()

	nativeTheme.on('updated', updateTrayIcon)

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('before-quit', () => {
	isQuitting = true
})
