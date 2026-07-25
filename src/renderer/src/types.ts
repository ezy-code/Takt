export interface Status {
  id: number
  name: string
  color: string
  position: number
  created_at: string
}

export interface Task {
  id: number
  name: string
  description: string
  description_md: string
  description_html: string
  statusId?: number | null
  today_date?: string | null
  created_at: string
  total_duration?: number
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
}

export interface TimeSummary {
  totalSessions: number
  totalDuration: number
  todayDuration: number
}

export interface ActiveTimerInfo {
  entry: TimeEntry
  task: Task
}

export type StartTimerResult =
  | { conflict: false; entry: TimeEntry }
  | { conflict: true; activeEntry: TimeEntry; activeTask: Task }

export interface Api {
  getTasks: () => Promise<Task[]>
  getTask: (id: number) => Promise<Task | null>
  addTask: (name: string, description: string, description_md?: string, description_html?: string, statusId?: number) => Promise<Task>
  deleteTask: (id: number) => Promise<{ success: boolean }>
  updateTask: (id: number, name: string, description: string, description_md?: string, description_html?: string, statusId?: number) => Promise<Task>
  getActiveTimer: () => Promise<ActiveTimerInfo | null>
  startTimer: (taskId: number) => Promise<StartTimerResult>
  stopTimer: (taskId: number) => Promise<TimeEntry | null>
  getAllTimeEntries: () => Promise<TimeEntryWithTask[]>
  getTimeSummary: () => Promise<TimeSummary>
  deleteTimeEntry: (id: number) => Promise<{ success: boolean }>
  showNotification: (title: string, body: string) => Promise<void>
  toggleTodayTask: (id: number) => Promise<{ success: boolean }>
  getTodayTasks: () => Promise<Task[]>
  clearTodayDate: (id: number) => Promise<{ success: boolean }>
  getStatuses: () => Promise<Status[]>
  addStatus: (name: string, color: string) => Promise<Status>
  updateStatus: (id: number, name: string, color: string) => Promise<Status>
  deleteStatus: (id: number) => Promise<{ success: boolean; reason?: string }>
  reorderStatuses: (ids: number[]) => Promise<{ success: boolean }>
  moveTask: (taskId: number, statusId: number) => Promise<Task>
  getAutostart: () => Promise<boolean>
  setAutostart: (enabled: boolean) => Promise<void>
}

declare global {
  interface Window {
    api: Api
  }
}
