import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'
import type { Api } from '../shared/api'
import { IPC } from '../shared/ipc'
import type { UpdaterState } from '../shared/updater'

const api: Api = {
	getTasks: () => ipcRenderer.invoke(IPC.GET_TASKS),
	getTask: (id: number) => ipcRenderer.invoke(IPC.GET_TASK, id),
	addTask: (name, description, description_md, description_html, statusId, projectId, myDay, reminderAt, hourlyRate) =>
		ipcRenderer.invoke(
			IPC.ADD_TASK,
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
			hourlyRate,
		),
	deleteTask: (id: number) => ipcRenderer.invoke(IPC.DELETE_TASK, id),
	updateTask: (
		id,
		name,
		description,
		description_md,
		description_html,
		statusId,
		projectId,
		myDay,
		reminderAt,
		hourlyRate,
	) =>
		ipcRenderer.invoke(
			IPC.UPDATE_TASK,
			id,
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
			hourlyRate,
		),
	getProjects: () => ipcRenderer.invoke(IPC.GET_PROJECTS),
	getProject: (id: number) => ipcRenderer.invoke(IPC.GET_PROJECT, id),
	addProject: (name, description, description_md, description_html, hourlyRate) =>
		ipcRenderer.invoke(IPC.ADD_PROJECT, name, description, description_md, description_html, hourlyRate),
	updateProject: (id, name, description, description_md, description_html, hourlyRate) =>
		ipcRenderer.invoke(IPC.UPDATE_PROJECT, id, name, description, description_md, description_html, hourlyRate),
	getActiveTimer: () => ipcRenderer.invoke(IPC.GET_ACTIVE_TIMER),
	getLastTimer: () => ipcRenderer.invoke(IPC.GET_LAST_TIMER),
	startTimer: (taskId: number) => ipcRenderer.invoke(IPC.START_TIMER, taskId),
	stopTimer: (taskId: number) => ipcRenderer.invoke(IPC.STOP_TIMER, taskId),
	getAllTimeEntries: () => ipcRenderer.invoke(IPC.GET_ALL_TIME_ENTRIES),
	getTimeSummary: () => ipcRenderer.invoke(IPC.GET_TIME_SUMMARY),
	deleteTimeEntry: (id: number) => ipcRenderer.invoke(IPC.DELETE_TIME_ENTRY, id),
	showNotification: (title, body) => ipcRenderer.invoke(IPC.SHOW_NOTIFICATION, title, body),
	onNavigateToTask: (callback: (id: number) => void) => {
		const listener = (_event: IpcRendererEvent, id: number) => callback(id)
		ipcRenderer.on(IPC.NAVIGATE_TO_TASK, listener)
		return () => ipcRenderer.removeListener(IPC.NAVIGATE_TO_TASK, listener)
	},
	toggleMyDayTask: (id: number) => ipcRenderer.invoke(IPC.TOGGLE_MY_DAY, id),
	getMyDayTasks: () => ipcRenderer.invoke(IPC.GET_MY_DAY_TASKS),
	clearMyDayDate: (id: number) => ipcRenderer.invoke(IPC.CLEAR_MY_DAY, id),
	getStatuses: () => ipcRenderer.invoke(IPC.GET_STATUSES),
	addStatus: (name, color) => ipcRenderer.invoke(IPC.ADD_STATUS, name, color),
	updateStatus: (id, name, color) => ipcRenderer.invoke(IPC.UPDATE_STATUS, id, name, color),
	deleteStatus: (id: number) => ipcRenderer.invoke(IPC.DELETE_STATUS, id),
	reorderStatuses: (ids: number[]) => ipcRenderer.invoke(IPC.REORDER_STATUSES, ids),
	setDefaultStatus: (id: number) => ipcRenderer.invoke(IPC.SET_DEFAULT_STATUS, id),
	moveTask: (taskId: number, statusId: number) => ipcRenderer.invoke(IPC.MOVE_TASK, taskId, statusId),
	reorderTasks: (columnId: number, orderedTaskIds: number[]) =>
		ipcRenderer.invoke(IPC.REORDER_TASKS, columnId, orderedTaskIds),
	updateTaskCanvasPosition: (id: number, x: number, y: number) =>
		ipcRenderer.invoke(IPC.UPDATE_TASK_CANVAS_POSITION, id, x, y),
	getTaskLinks: () => ipcRenderer.invoke(IPC.GET_TASK_LINKS),
	addTaskLink: (sourceTaskId: number, targetTaskId: number) =>
		ipcRenderer.invoke(IPC.ADD_TASK_LINK, sourceTaskId, targetTaskId),
	deleteTaskLink: (id: number) => ipcRenderer.invoke(IPC.DELETE_TASK_LINK, id),
	getAutostart: () => ipcRenderer.invoke(IPC.GET_AUTOSTART),
	setAutostart: (enabled: boolean) => ipcRenderer.invoke(IPC.SET_AUTOSTART, enabled),
	getAppImageDesktopEntryStatus: () => ipcRenderer.invoke(IPC.APPIMAGE_GET_DESKTOP_ENTRY_STATUS),
	setAppImageDesktopEntry: (enabled: boolean) => ipcRenderer.invoke(IPC.APPIMAGE_SET_DESKTOP_ENTRY, enabled),
	getMeta: (key: string) => ipcRenderer.invoke(IPC.GET_META, key),
	setMeta: (key: string, value: string) => ipcRenderer.invoke(IPC.SET_META, key, value),
	getUpdaterState: () => ipcRenderer.invoke(IPC.UPDATER_GET_STATE),
	checkForUpdates: () => ipcRenderer.invoke(IPC.UPDATER_CHECK),
	downloadUpdate: () => ipcRenderer.invoke(IPC.UPDATER_DOWNLOAD),
	installUpdate: () => ipcRenderer.invoke(IPC.UPDATER_INSTALL),
	onUpdaterStatus: (callback: (state: UpdaterState) => void) => {
		const listener = (_event: IpcRendererEvent, state: UpdaterState) => callback(state)
		ipcRenderer.on(IPC.UPDATER_STATUS, listener)
		return () => ipcRenderer.removeListener(IPC.UPDATER_STATUS, listener)
	},
}

contextBridge.exposeInMainWorld('api', api)
