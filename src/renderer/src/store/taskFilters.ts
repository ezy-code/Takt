import { create } from 'zustand'

interface TaskFiltersState {
	projectFilter: string | null
	groupFilter: string | null
	statusFilter: string | null
	setProjectFilter: (value: string | null) => void
	setGroupFilter: (value: string | null) => void
	setStatusFilter: (value: string | null) => void
	reset: () => void
}

export const useTaskFiltersStore = create<TaskFiltersState>((set) => ({
	projectFilter: null,
	groupFilter: null,
	statusFilter: null,
	setProjectFilter: (projectFilter) => set({ projectFilter }),
	setGroupFilter: (groupFilter) => set({ groupFilter }),
	setStatusFilter: (statusFilter) => set({ statusFilter }),
	reset: () => set({ projectFilter: null, groupFilter: null, statusFilter: null }),
}))
