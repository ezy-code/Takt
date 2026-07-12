export interface Task {
  id: number
  name: string
  description: string
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
  addTask: (name: string, description: string) => Promise<Task>
  deleteTask: (id: number) => Promise<{ success: boolean }>
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
}

declare global {
  interface Window {
    api: Api
  }
}
