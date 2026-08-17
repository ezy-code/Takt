import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TaskFiltersState {
	projectFilter: string | null
	groupFilter: string | null
	statusFilter: string | null
	showOnlyParents: boolean
	entityTypeFilter: 'task' | 'note' | 'project' | null
	setProjectFilter: (value: string | null) => void
	setGroupFilter: (value: string | null) => void
	setStatusFilter: (value: string | null) => void
	setShowOnlyParents: (value: boolean) => void
	setEntityTypeFilter: (value: 'task' | 'note' | 'project' | null) => void
	reset: () => void
}

export const useTaskFiltersStore = create<TaskFiltersState>()(
	persist(
		(set) => ({
			projectFilter: null,
			groupFilter: null,
			statusFilter: null,
			showOnlyParents: false,
			entityTypeFilter: null,
			setProjectFilter: (projectFilter) => set({ projectFilter }),
			setGroupFilter: (groupFilter) => set({ groupFilter }),
			setStatusFilter: (statusFilter) => set({ statusFilter }),
			setShowOnlyParents: (showOnlyParents) => set({ showOnlyParents }),
			setEntityTypeFilter: (entityTypeFilter) => set({ entityTypeFilter }),
			reset: () =>
				set({
					projectFilter: null,
					groupFilter: null,
					statusFilter: null,
					showOnlyParents: false,
					entityTypeFilter: null,
				}),
		}),
		{ name: 'takt-task-filters' },
	),
)
