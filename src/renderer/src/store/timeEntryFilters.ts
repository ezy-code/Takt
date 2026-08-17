import { create } from 'zustand'

interface TimeEntryFiltersState {
	itemFilter: string | null
	dateFrom: string | null
	dateTo: string | null
	setItemFilter: (value: string | null) => void
	setDateFrom: (value: string | null) => void
	setDateTo: (value: string | null) => void
	reset: () => void
}

export const useTimeEntryFiltersStore = create<TimeEntryFiltersState>((set) => ({
	itemFilter: null,
	dateFrom: null,
	dateTo: null,
	setItemFilter: (itemFilter) => set({ itemFilter }),
	setDateFrom: (dateFrom) => set({ dateFrom }),
	setDateTo: (dateTo) => set({ dateTo }),
	reset: () => set({ itemFilter: null, dateFrom: null, dateTo: null }),
}))
