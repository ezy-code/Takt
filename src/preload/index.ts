import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'
import type { Api } from '../shared/api'
import { IPC } from '../shared/ipc'
import type { UpdaterState } from '../shared/updater'

const api: Api = {
	getItems: () => ipcRenderer.invoke(IPC.GET_ITEMS),
	getItem: (id: number) => ipcRenderer.invoke(IPC.GET_ITEM, id),
	addItem: (payload) => ipcRenderer.invoke(IPC.ADD_ITEM, payload),
	deleteItem: (id: number) => ipcRenderer.invoke(IPC.DELETE_ITEM, id),
	updateItem: (payload) => ipcRenderer.invoke(IPC.UPDATE_ITEM, payload),
	getActiveTimer: () => ipcRenderer.invoke(IPC.GET_ACTIVE_TIMER),
	getLastTimer: () => ipcRenderer.invoke(IPC.GET_LAST_TIMER),
	startTimer: (itemId: number) => ipcRenderer.invoke(IPC.START_TIMER, itemId),
	stopTimer: (itemId: number) => ipcRenderer.invoke(IPC.STOP_TIMER, itemId),
	getAllTimeEntries: () => ipcRenderer.invoke(IPC.GET_ALL_TIME_ENTRIES),
	getTimeSummary: () => ipcRenderer.invoke(IPC.GET_TIME_SUMMARY),
	updateTimeEntry: (payload) => ipcRenderer.invoke(IPC.UPDATE_TIME_ENTRY, payload),
	deleteTimeEntry: (id: number) => ipcRenderer.invoke(IPC.DELETE_TIME_ENTRY, id),
	showNotification: (title, body) => ipcRenderer.invoke(IPC.SHOW_NOTIFICATION, title, body),
	onNavigateToItem: (callback: (id: number) => void) => {
		const listener = (_event: IpcRendererEvent, id: number) => callback(id)
		ipcRenderer.on(IPC.NAVIGATE_TO_ITEM, listener)
		return () => ipcRenderer.removeListener(IPC.NAVIGATE_TO_ITEM, listener)
	},
	onTimerChanged: (callback: () => void) => {
		const listener = () => callback()
		ipcRenderer.on(IPC.TIMER_CHANGED, listener)
		return () => ipcRenderer.removeListener(IPC.TIMER_CHANGED, listener)
	},
	toggleMyDayItem: (id: number) => ipcRenderer.invoke(IPC.TOGGLE_MY_DAY, id),
	getMyDayItems: () => ipcRenderer.invoke(IPC.GET_MY_DAY_ITEMS),
	clearMyDayDate: (id: number) => ipcRenderer.invoke(IPC.CLEAR_MY_DAY, id),
	getStatuses: () => ipcRenderer.invoke(IPC.GET_STATUSES),
	addStatus: (name, color) => ipcRenderer.invoke(IPC.ADD_STATUS, name, color),
	updateStatus: (id, name, color) => ipcRenderer.invoke(IPC.UPDATE_STATUS, id, name, color),
	deleteStatus: (id: number) => ipcRenderer.invoke(IPC.DELETE_STATUS, id),
	reorderStatuses: (ids: number[]) => ipcRenderer.invoke(IPC.REORDER_STATUSES, ids),
	setDefaultStatus: (id: number) => ipcRenderer.invoke(IPC.SET_DEFAULT_STATUS, id),
	moveItem: (itemId: number, statusId: number) => ipcRenderer.invoke(IPC.MOVE_ITEM, itemId, statusId),
	reorderItems: (columnId: number, orderedItemIds: number[]) =>
		ipcRenderer.invoke(IPC.REORDER_ITEMS, columnId, orderedItemIds),
	updateItemCanvasPosition: (id: number, x: number, y: number) =>
		ipcRenderer.invoke(IPC.UPDATE_ITEM_CANVAS_POSITION, id, x, y),
	getEntityChildren: (parentId: number) => ipcRenderer.invoke(IPC.GET_ENTITY_CHILDREN, parentId),
	getEntityAncestors: (entityId: number) => ipcRenderer.invoke(IPC.GET_ENTITY_ANCESTORS, entityId),
	searchEntities: (query: string, limit?: number) => ipcRenderer.invoke(IPC.SEARCH_ENTITIES, query, limit),
	getGroups: () => ipcRenderer.invoke(IPC.GET_GROUPS),
	addGroup: (payload) => ipcRenderer.invoke(IPC.ADD_GROUP, payload),
	updateGroup: (payload) => ipcRenderer.invoke(IPC.UPDATE_GROUP, payload),
	deleteGroup: (id: number) => ipcRenderer.invoke(IPC.DELETE_GROUP, id),
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
