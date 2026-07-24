import { app, ipcMain } from 'electron'
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const AUTOSTART_ARGS = ['--hidden']

function getDesktopFilePath(): string {
  const name = app.getName()
  return join(homedir(), '.config', 'autostart', `${name}.desktop`)
}

function enableAutostart() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      path: process.execPath,
      args: AUTOSTART_ARGS,
    })
  } else if (process.platform === 'linux') {
    const dir = join(homedir(), '.config', 'autostart')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(
      getDesktopFilePath(),
      `[Desktop Entry]
Type=Application
Version=1.0
Name=${app.getName()}
Comment=Autostart for ${app.getName()}
Exec=${process.execPath} ${AUTOSTART_ARGS.join(' ')}
StartupNotify=false
Terminal=false
X-GNOME-Autostart-enabled=true`,
      'utf-8'
    )
  }
}

function disableAutostart() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({ openAtLogin: false })
  } else if (process.platform === 'linux') {
    const fp = getDesktopFilePath()
    if (existsSync(fp)) unlinkSync(fp)
  }
}

function isAutostartEnabled(): boolean {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return app.getLoginItemSettings().openAtLogin
  } else if (process.platform === 'linux') {
    return existsSync(getDesktopFilePath())
  }
  return false
}

export function initAutostart() {
  ipcMain.handle('get-autostart', () => isAutostartEnabled())
  ipcMain.handle('set-autostart', (_event, enabled: boolean) => {
    if (enabled) enableAutostart()
    else disableAutostart()
  })
}
