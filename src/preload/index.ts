import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'
import type { UpdaterState } from '../shared/updater'

contextBridge.exposeInMainWorld('api', {
	getTasks: () => ipcRenderer.invoke('get-tasks'),
	getTask: (id: number) => ipcRenderer.invoke('get-task', id),
	addTask: (
		name: string,
		description: string,
		description_md?: string,
		description_html?: string,
		statusId?: number,
		projectId?: number,
		myDay?: boolean | string | null,
		reminderAt?: string | null,
	) =>
		ipcRenderer.invoke(
			'add-task',
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
		),
	deleteTask: (id: number) => ipcRenderer.invoke('delete-task', id),
	updateTask: (
		id: number,
		name: string,
		description: string,
		description_md?: string,
		description_html?: string,
		statusId?: number,
		projectId?: number,
		myDay?: boolean | string | null,
		reminderAt?: string | null,
	) =>
		ipcRenderer.invoke(
			'update-task',
			id,
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
		),
	getProjects: () => ipcRenderer.invoke('get-projects'),
	getProject: (id: number) => ipcRenderer.invoke('get-project', id),
	addProject: (name: string, description?: string, description_md?: string, description_html?: string) =>
		ipcRenderer.invoke('add-project', name, description, description_md, description_html),
	updateProject: (id: number, name: string, description?: string, description_md?: string, description_html?: string) =>
		ipcRenderer.invoke('update-project', id, name, description, description_md, description_html),
	getActiveTimer: () => ipcRenderer.invoke('get-active-timer'),
	getLastTimer: () => ipcRenderer.invoke('get-last-timer'),
	startTimer: (taskId: number) => ipcRenderer.invoke('start-timer', taskId),
	stopTimer: (taskId: number) => ipcRenderer.invoke('stop-timer', taskId),
	getAllTimeEntries: () => ipcRenderer.invoke('get-all-time-entries'),
	getTimeSummary: () => ipcRenderer.invoke('get-time-summary'),
	deleteTimeEntry: (id: number) => ipcRenderer.invoke('delete-time-entry', id),
	showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
	onNavigateToTask: (callback: (id: number) => void) => {
		const listener = (_event: IpcRendererEvent, id: number) => callback(id)
		ipcRenderer.on('navigate-to-task', listener)
		return () => ipcRenderer.removeListener('navigate-to-task', listener)
	},
	toggleMyDayTask: (id: number) => ipcRenderer.invoke('toggle-my-day', id),
	getMyDayTasks: () => ipcRenderer.invoke('get-my-day-tasks'),
	clearMyDayDate: (id: number) => ipcRenderer.invoke('clear-my-day-date', id),
	getStatuses: () => ipcRenderer.invoke('get-statuses'),
	addStatus: (name: string, color: string) => ipcRenderer.invoke('add-status', name, color),
	updateStatus: (id: number, name: string, color: string) => ipcRenderer.invoke('update-status', id, name, color),
	deleteStatus: (id: number) => ipcRenderer.invoke('delete-status', id),
	reorderStatuses: (ids: number[]) => ipcRenderer.invoke('reorder-statuses', ids),
	setDefaultStatus: (id: number) => ipcRenderer.invoke('set-default-status', id),
	moveTask: (taskId: number, statusId: number) => ipcRenderer.invoke('move-task', taskId, statusId),
	reorderTasks: (columnId: number, orderedTaskIds: number[]) =>
		ipcRenderer.invoke('reorder-tasks', columnId, orderedTaskIds),
	getAutostart: () => ipcRenderer.invoke('get-autostart'),
	setAutostart: (enabled: boolean) => ipcRenderer.invoke('set-autostart', enabled),
	getAppImageDesktopEntryStatus: () => ipcRenderer.invoke('appimage:get-desktop-entry-status'),
	setAppImageDesktopEntry: (enabled: boolean) => ipcRenderer.invoke('appimage:set-desktop-entry', enabled),
	getMeta: (key: string) => ipcRenderer.invoke('get-meta', key),
	setMeta: (key: string, value: string) => ipcRenderer.invoke('set-meta', key, value),
	getUpdaterState: () => ipcRenderer.invoke('updater:get-state'),
	checkForUpdates: () => ipcRenderer.invoke('updater:check'),
	downloadUpdate: () => ipcRenderer.invoke('updater:download'),
	installUpdate: () => ipcRenderer.invoke('updater:install'),
	onUpdaterStatus: (callback: (state: UpdaterState) => void) => {
		const listener = (_event: IpcRendererEvent, state: UpdaterState) => callback(state)
		ipcRenderer.on('updater:status', listener)
		return () => ipcRenderer.removeListener('updater:status', listener)
	},
})
