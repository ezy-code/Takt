import { create } from 'zustand'

interface TimeEntryFiltersState {
	projectFilter: string | null
	taskFilter: string | null
	dateFrom: string | null
	dateTo: string | null
	setProjectFilter: (value: string | null) => void
	setTaskFilter: (value: string | null) => void
	setDateFrom: (value: string | null) => void
	setDateTo: (value: string | null) => void
	reset: () => void
}

export const useTimeEntryFiltersStore = create<TimeEntryFiltersState>((set) => ({
	projectFilter: null,
	taskFilter: null,
	dateFrom: null,
	dateTo: null,
	setProjectFilter: (projectFilter) => set({ projectFilter }),
	setTaskFilter: (taskFilter) => set({ taskFilter }),
	setDateFrom: (dateFrom) => set({ dateFrom }),
	setDateTo: (dateTo) => set({ dateTo }),
	reset: () => set({ projectFilter: null, taskFilter: null, dateFrom: null, dateTo: null }),
}))
