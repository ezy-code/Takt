import { create } from 'zustand'
import type { Task, TimeEntry } from '../types'

interface TimerState {
	activeEntry: TimeEntry | null
	activeTask: Task | null
	setActive: (entry: TimeEntry | null, task: Task | null) => void
}

export const useTimerStore = create<TimerState>((set) => ({
	activeEntry: null,
	activeTask: null,
	setActive: (entry, task) => set({ activeEntry: entry, activeTask: task }),
}))
