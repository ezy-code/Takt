import { app, BrowserWindow, Tray, Menu, nativeImage, nativeTheme, Notification, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase } from './database'

let tray: Tray | null = null
let isQuitting = false
let isTimerActive = false

function getTrayIcon(): string {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  const suffix = isTimerActive ? '-active' : ''
  return join(__dirname, `../../resources/icon-${theme}${suffix}.png`)
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
      click: showWindow
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Electron App')
  tray.setContextMenu(contextMenu)
  tray.on('click', showWindow)
}

function updateTrayIcon() {
  if (tray) {
    tray.setImage(nativeImage.createFromPath(getTrayIcon()))
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
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

app.whenReady().then(() => {
  initDatabase((active) => {
    isTimerActive = active
    updateTrayIcon()
  })
  createWindow()
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
