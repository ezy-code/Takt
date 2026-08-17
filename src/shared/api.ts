import type { UpdaterState } from './updater'

export interface Status {
	id: number
	name: string
	color: string
	position: number
	is_default: boolean
	created_at: string
}

export type RateSource = 'item' | 'default'

export type EntityType = 'task' | 'note'

export interface Item {
	id: number
	name: string
	description: string
	description_md: string
	description_html: string
	statusId?: number | null
	parentId?: number | null
	parentName?: string | null
	parentType?: EntityType | null
	groupId?: number | null
	entityType?: EntityType
	my_day_date?: string | null
	reminder_at?: string | null
	created_at: string
	position?: number
	total_duration?: number
	canvasX?: number | null
	canvasY?: number | null
	canvasWidth?: number | null
	canvasHeight?: number | null
	hourly_rate?: number | null
	rate?: number | null
	rateSource?: RateSource
	cost?: number
}

export interface TimeEntry {
	id: number
	itemId: number
	startTime: string
	stopTime: string | null
	duration: number | null
}

export interface TimeEntryWithItem extends TimeEntry {
	itemName: string
	parentId?: number | null
	parentName?: string | null
	rate?: number | null
	rateSource?: RateSource
	cost?: number
}

export interface UpdateTimeEntryPayload {
	id: number
	startTime: string
	stopTime: string
}

export interface TimeSummary {
	totalSessions: number
	totalDuration: number
	todayDuration: number
	totalCost: number
	todayCost: number
}

export interface ActiveTimerInfo {
	entry: TimeEntry
	item: Item
}

export type StartTimerResult =
	| { conflict: false; entry: TimeEntry; item: Item }
	| { conflict: true; activeEntry: TimeEntry; activeItem: Item }

export type StopTimerResult = { entry: TimeEntry; item: Item } | null

export interface EntitySummary {
	id: number
	name: string
	entityType?: EntityType
}

export interface EntitySearchResult {
	id: number
	name: string
	entityType: EntityType
	parentName: string | null
	snippet: string | null
}

export interface Group {
	id: number
	name: string
	parentId?: number | null
	canvasX?: number | null
	canvasY?: number | null
	width: number
	height: number
	color: string
	created_at?: string | null
}

export type AddGroupPayload = Partial<Omit<Group, 'id' | 'created_at'>>
export type UpdateGroupPayload = Partial<Omit<Group, 'created_at'>> & { id: number }

export interface AddItemPayload {
	name: string
	description: string
	description_md?: string
	description_html?: string
	statusId?: number | null
	parentId?: number | null
	groupId?: number | null
	myDay?: boolean | string | null
	reminderAt?: string | null
	hourlyRate?: number | null
	entityType?: EntityType
}

export interface UpdateItemPayload extends Partial<AddItemPayload> {
	id: number
	canvasX?: number | null
	canvasY?: number | null
	canvasWidth?: number | null
	canvasHeight?: number | null
}

export interface Api {
	getItems: () => Promise<Item[]>
	getItem: (id: number) => Promise<Item | null>
	addItem: (payload: AddItemPayload) => Promise<Item>
	deleteItem: (id: number) => Promise<{ success: boolean }>
	updateItem: (payload: UpdateItemPayload) => Promise<Item>
	getActiveTimer: () => Promise<ActiveTimerInfo | null>
	getLastTimer: () => Promise<ActiveTimerInfo | null>
	startTimer: (itemId: number) => Promise<StartTimerResult>
	stopTimer: (itemId: number) => Promise<StopTimerResult>
	getAllTimeEntries: () => Promise<TimeEntryWithItem[]>
	getTimeSummary: () => Promise<TimeSummary>
	updateTimeEntry: (payload: UpdateTimeEntryPayload) => Promise<TimeEntry>
	deleteTimeEntry: (id: number) => Promise<{ success: boolean }>
	showNotification: (title: string, body: string) => Promise<void>
	onNavigateToItem: (callback: (id: number) => void) => () => void
	onTimerChanged: (callback: () => void) => () => void
	toggleMyDayItem: (id: number) => Promise<{ success: boolean }>
	getMyDayItems: () => Promise<Item[]>
	clearMyDayDate: (id: number) => Promise<{ success: boolean }>
	getStatuses: () => Promise<Status[]>
	addStatus: (name: string, color: string) => Promise<Status>
	updateStatus: (id: number, name: string, color: string) => Promise<Status>
	deleteStatus: (id: number) => Promise<{ success: boolean; reason?: string }>
	reorderStatuses: (ids: number[]) => Promise<{ success: boolean }>
	setDefaultStatus: (id: number) => Promise<Status>
	moveItem: (itemId: number, statusId: number) => Promise<Item>
	reorderItems: (columnId: number, orderedItemIds: number[]) => Promise<{ success: boolean }>
	updateItemCanvasPosition: (id: number, x: number, y: number) => Promise<Item>
	getEntityChildren: (parentId: number) => Promise<Item[]>
	getEntityAncestors: (entityId: number) => Promise<EntitySummary[]>
	searchEntities: (query: string, limit?: number) => Promise<EntitySearchResult[]>
	getGroups: () => Promise<Group[]>
	addGroup: (payload: AddGroupPayload) => Promise<Group>
	updateGroup: (payload: UpdateGroupPayload) => Promise<Group>
	deleteGroup: (id: number) => Promise<{ success: boolean }>
	getAutostart: () => Promise<boolean>
	setAutostart: (enabled: boolean) => Promise<void>
	getAppImageDesktopEntryStatus: () => Promise<{ supported: boolean; enabled: boolean | null }>
	setAppImageDesktopEntry: (enabled: boolean) => Promise<{ success: boolean }>
	getMeta: (key: string) => Promise<string | null>
	setMeta: (key: string, value: string) => Promise<{ success: boolean }>
	getUpdaterState: () => Promise<UpdaterState>
	checkForUpdates: () => Promise<UpdaterState>
	downloadUpdate: () => Promise<UpdaterState>
	installUpdate: () => Promise<{ success: boolean }>
	onUpdaterStatus: (callback: (state: UpdaterState) => void) => () => void
}
