import type { UpdaterState } from './updater'

export interface Status {
	id: number
	name: string
	color: string
	position: number
	is_default: boolean
	created_at: string
}

export type RateSource = 'task' | 'project' | 'default'

export interface Project {
	id: number
	name: string
	description: string
	description_md: string
	description_html: string
	created_at: string
	hourly_rate?: number | null
}

export interface Task {
	id: number
	name: string
	description: string
	description_md: string
	description_html: string
	statusId?: number | null
	projectId?: number | null
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
	projectId?: number | null
	projectName?: string | null
	rate?: number | null
	rateSource?: RateSource
	cost?: number
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

export interface TaskLink {
	id: number
	sourceTaskId: number
	targetTaskId: number
	created_at?: string | null
}

export interface AddTaskPayload {
	name: string
	description: string
	description_md?: string
	description_html?: string
	statusId?: number
	projectId?: number
	myDay?: boolean | string | null
	reminderAt?: string | null
	hourlyRate?: number | null
}

export interface UpdateTaskPayload extends AddTaskPayload {
	id: number
}

export interface AddProjectPayload {
	name: string
	description?: string
	description_md?: string
	description_html?: string
	hourlyRate?: number | null
}

export interface UpdateProjectPayload extends AddProjectPayload {
	id: number
}

export interface Api {
	getTasks: () => Promise<Task[]>
	getTask: (id: number) => Promise<Task | null>
	addTask: (payload: AddTaskPayload) => Promise<Task>
	deleteTask: (id: number) => Promise<{ success: boolean }>
	updateTask: (payload: UpdateTaskPayload) => Promise<Task>
	getProjects: () => Promise<Project[]>
	getProject: (id: number) => Promise<Project | null>
	addProject: (payload: AddProjectPayload) => Promise<Project>
	updateProject: (payload: UpdateProjectPayload) => Promise<Project>
	getActiveTimer: () => Promise<ActiveTimerInfo | null>
	getLastTimer: () => Promise<ActiveTimerInfo | null>
	startTimer: (taskId: number) => Promise<StartTimerResult>
	stopTimer: (taskId: number) => Promise<StopTimerResult>
	getAllTimeEntries: () => Promise<TimeEntryWithTask[]>
	getTimeSummary: () => Promise<TimeSummary>
	deleteTimeEntry: (id: number) => Promise<{ success: boolean }>
	showNotification: (title: string, body: string) => Promise<void>
	onNavigateToTask: (callback: (id: number) => void) => () => void
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
	getTaskLinks: () => Promise<TaskLink[]>
	addTaskLink: (sourceTaskId: number, targetTaskId: number) => Promise<TaskLink>
	deleteTaskLink: (id: number) => Promise<{ success: boolean }>
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
