import { create } from 'zustand'

interface TimeEntryFiltersState {
	taskFilter: string | null
	dateFrom: string | null
	dateTo: string | null
	setTaskFilter: (value: string | null) => void
	setDateFrom: (value: string | null) => void
	setDateTo: (value: string | null) => void
	reset: () => void
}

export const useTimeEntryFiltersStore = create<TimeEntryFiltersState>((set) => ({
	taskFilter: null,
	dateFrom: null,
	dateTo: null,
	setTaskFilter: (taskFilter) => set({ taskFilter }),
	setDateFrom: (dateFrom) => set({ dateFrom }),
	setDateTo: (dateTo) => set({ dateTo }),
	reset: () => set({ taskFilter: null, dateFrom: null, dateTo: null }),
}))
