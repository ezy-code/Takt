import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app, ipcMain } from 'electron'
import { AUTOSTART_ARG, META_APPIMAGE_DESKTOP_KEY } from '../shared/constants'
import { IPC } from '../shared/ipc'
import { getMeta, setMeta } from './db/meta'
import { getResourcePath } from './helpers'

const isLinux = (): boolean => process.platform === 'linux'
const isAppImage = (): boolean => isLinux() && !!process.env.APPIMAGE
const getExecPath = (): string => process.env.APPIMAGE || process.execPath

const launcherDir = (): string => path.join(os.homedir(), '.local/share/applications')
const autostartDir = (): string => path.join(os.homedir(), '.config/autostart')
const desktopFilePath = (dir: string): string => path.join(dir, `${app.getName()}.desktop`)
const iconPath = (): string => path.join(os.homedir(), '.local/share/icons', `${app.getName()}Icon.png`)

function toDesktopFile(fields: Record<string, string>): string {
	return ['[Desktop Entry]', ...Object.entries(fields).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n'
}

function writeDesktopEntry(dir: string, fields: Record<string, string>): boolean {
	try {
		fs.mkdirSync(dir, { recursive: true })
		fs.writeFileSync(desktopFilePath(dir), toDesktopFile(fields), 'utf-8')
		return true
	} catch {
		return false
	}
}

function deleteDesktopEntry(dir: string): boolean {
	if (!isLinux()) return false
	try {
		const fp = desktopFilePath(dir)
		if (fs.existsSync(fp)) fs.unlinkSync(fp)
		return true
	} catch {
		return false
	}
}

function baseFields(comment: string, exec: string): Record<string, string> {
	const name = app.getName()
	return {
		Type: 'Application',
		Version: '1.0',
		Categories: 'Utility',
		Name: name,
		Comment: comment,
		Exec: exec,
		Terminal: 'false',
		StartupNotify: 'false',
		StartupWMClass: name,
	}
}

function buildLauncherFields(): Record<string, string> {
	return {
		...baseFields('Tasks, notes, time tracker', `"${getExecPath()}" %U`),
		Icon: iconPath(),
	}
}

function buildAutostartFields(): Record<string, string> {
	const name = app.getName()
	return {
		...baseFields(`Autostart for ${name}`, `"${getExecPath()}" ${AUTOSTART_ARG}`),
		'X-GNOME-Autostart-enabled': 'true',
		'X-KDE-autostart-after': 'panel',
	}
}

function copyIcon(): boolean {
	try {
		fs.mkdirSync(path.dirname(iconPath()), { recursive: true })
		fs.copyFileSync(getResourcePath('app-icon.png'), iconPath())
		return true
	} catch {
		return false
	}
}

export const getAppImageDesktopEntryPath = (): string => desktopFilePath(launcherDir())

function refreshKdeDesktopCache(): void {
	if (!isLinux()) return
	const desktop = process.env.XDG_CURRENT_DESKTOP ?? ''
	if (process.env.KDE_FULL_SESSION !== 'true' && !desktop.includes('KDE')) return
	for (const bin of ['kbuildsycoca6', 'kbuildsycoca5']) {
		try {
			spawnSync(bin, { stdio: 'ignore' })
			return
		} catch {}
	}
}

function updateDesktopDatabase(): void {
	if (!isLinux()) return
	try {
		spawnSync('update-desktop-database', [launcherDir()], { stdio: 'ignore' })
	} catch {}
}

export const createAppImageDesktopEntry = (): boolean => {
	if (!isAppImage()) return false
	const ok = copyIcon() && writeDesktopEntry(launcherDir(), buildLauncherFields())
	if (ok) refreshKdeDesktopCache()
	updateDesktopDatabase()
	return ok
}

export const deleteAppImageDesktopEntry = (): boolean => deleteDesktopEntry(launcherDir())

export const createLinuxAutostartEntry = (): boolean => {
	if (!isLinux()) return false
	return writeDesktopEntry(autostartDir(), buildAutostartFields())
}

export const deleteLinuxAutostartEntry = (): boolean => deleteDesktopEntry(autostartDir())

export const isLinuxAutostartEnabled = (): boolean => isLinux() && fs.existsSync(desktopFilePath(autostartDir()))

function getAppImageDesktopEntryStatus(): { supported: boolean; enabled: boolean | null } {
	if (!isAppImage()) return { supported: false, enabled: null }
	const value = getMeta(META_APPIMAGE_DESKTOP_KEY)
	return { supported: true, enabled: value === null ? null : value === '1' }
}

function ensureAppImageDesktopEntryUpToDate(): void {
	const fp = getAppImageDesktopEntryPath()
	const execLine = fs.existsSync(fp)
		? fs
				.readFileSync(fp, 'utf-8')
				.split('\n')
				.find((l) => l.startsWith('Exec='))
		: null
	if (!execLine?.includes(process.env.APPIMAGE ?? '')) {
		createAppImageDesktopEntry()
	}
}

export function initAppImageDesktopEntry(): void {
	ipcMain.handle(IPC.APPIMAGE_GET_DESKTOP_ENTRY_STATUS, () => getAppImageDesktopEntryStatus())

	ipcMain.handle(IPC.APPIMAGE_SET_DESKTOP_ENTRY, (_event, enabled: boolean) => {
		if (!isAppImage()) return { success: false }
		setMeta(META_APPIMAGE_DESKTOP_KEY, enabled ? '1' : '0')
		return { success: enabled ? createAppImageDesktopEntry() : deleteAppImageDesktopEntry() }
	})

	if (getAppImageDesktopEntryStatus().enabled === true) {
		ensureAppImageDesktopEntryUpToDate()
	}
}
