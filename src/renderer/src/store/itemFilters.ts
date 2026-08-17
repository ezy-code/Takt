import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ItemFiltersState {
	groupFilter: string | null
	statusFilter: string | null
	showOnlyParents: boolean
	entityTypeFilter: 'task' | 'note' | null
	setGroupFilter: (value: string | null) => void
	setStatusFilter: (value: string | null) => void
	setShowOnlyParents: (value: boolean) => void
	setEntityTypeFilter: (value: 'task' | 'note' | null) => void
	reset: () => void
}

export const useItemFiltersStore = create<ItemFiltersState>()(
	persist(
		(set) => ({
			groupFilter: null,
			statusFilter: null,
			showOnlyParents: false,
			entityTypeFilter: null,
			setGroupFilter: (groupFilter) => set({ groupFilter }),
			setStatusFilter: (statusFilter) => set({ statusFilter }),
			setShowOnlyParents: (showOnlyParents) => set({ showOnlyParents }),
			setEntityTypeFilter: (entityTypeFilter) => set({ entityTypeFilter }),
			reset: () =>
				set({
					groupFilter: null,
					statusFilter: null,
					showOnlyParents: false,
					entityTypeFilter: null,
				}),
		}),
		{ name: 'takt-item-filters' },
	),
)
