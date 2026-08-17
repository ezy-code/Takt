import type { UpdaterState } from './updater'

export interface Status {
	id: number
	name: string
	color: string
	position: number
	is_default: boolean
	created_at: string
}

export type RateSource = 'task' | 'default'

export type EntityType = 'task' | 'note'

export interface Task {
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
	hourly_rate?: number | null
	rate?: number | null
	rateSource?: RateSource
	cost?: number
}

export interface TimeEntry {
	id: number
	taskId: number
	startTime: string
	stopTime: string | null
	duration: number | null
}

export interface TimeEntryWithTask extends TimeEntry {
	taskName: string
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
	task: Task
}

export type StartTimerResult =
	| { conflict: false; entry: TimeEntry; task: Task }
	| { conflict: true; activeEntry: TimeEntry; activeTask: Task }

export type StopTimerResult = { entry: TimeEntry; task: Task } | null

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

export interface AddTaskPayload {
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

export interface UpdateTaskPayload extends Partial<AddTaskPayload> {
	id: number
	canvasX?: number | null
	canvasY?: number | null
}

export interface Api {
	getTasks: () => Promise<Task[]>
	getTask: (id: number) => Promise<Task | null>
	addTask: (payload: AddTaskPayload) => Promise<Task>
	deleteTask: (id: number) => Promise<{ success: boolean }>
	updateTask: (payload: UpdateTaskPayload) => Promise<Task>
	getActiveTimer: () => Promise<ActiveTimerInfo | null>
	getLastTimer: () => Promise<ActiveTimerInfo | null>
	startTimer: (taskId: number) => Promise<StartTimerResult>
	stopTimer: (taskId: number) => Promise<StopTimerResult>
	getAllTimeEntries: () => Promise<TimeEntryWithTask[]>
	getTimeSummary: () => Promise<TimeSummary>
	updateTimeEntry: (payload: UpdateTimeEntryPayload) => Promise<TimeEntry>
	deleteTimeEntry: (id: number) => Promise<{ success: boolean }>
	showNotification: (title: string, body: string) => Promise<void>
	onNavigateToTask: (callback: (id: number) => void) => () => void
	onTimerChanged: (callback: () => void) => () => void
	toggleMyDayTask: (id: number) => Promise<{ success: boolean }>
	getMyDayTasks: () => Promise<Task[]>
	clearMyDayDate: (id: number) => Promise<{ success: boolean }>
	getStatuses: () => Promise<Status[]>
	addStatus: (name: string, color: string) => Promise<Status>
	updateStatus: (id: number, name: string, color: string) => Promise<Status>
	deleteStatus: (id: number) => Promise<{ success: boolean; reason?: string }>
	reorderStatuses: (ids: number[]) => Promise<{ success: boolean }>
	setDefaultStatus: (id: number) => Promise<Status>
	moveTask: (taskId: number, statusId: number) => Promise<Task>
	reorderTasks: (columnId: number, orderedTaskIds: number[]) => Promise<{ success: boolean }>
	updateTaskCanvasPosition: (id: number, x: number, y: number) => Promise<Task>
	getEntityChildren: (parentId: number) => Promise<Task[]>
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
