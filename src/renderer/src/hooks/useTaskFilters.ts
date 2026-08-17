import type { Task } from '../../../shared/api'
import { useGroups, useStatuses, useTasks } from '../api'
import { useTaskFiltersStore } from '../store/taskFilters'

type TaskFilters = {
	groupId: number | null
	statusId: number | null
	showOnlyParents: boolean
	entityType: 'task' | 'note' | null
}

function toId(value: string | null): number | null {
	return value == null ? null : Number(value)
}

function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
	const parentIds = new Set(tasks.flatMap((task) => (task.parentId == null ? [] : [task.parentId])))

	return tasks.filter(
		(task) =>
			(filters.groupId == null || task.groupId === filters.groupId) &&
			(filters.statusId == null || task.statusId === filters.statusId) &&
			(!filters.showOnlyParents || parentIds.has(task.id)) &&
			(filters.entityType == null || (task.entityType ?? 'task') === filters.entityType),
	)
}

export function useTaskFilters() {
	const { data: tasks, isLoading } = useTasks()
	const { data: groups } = useGroups()
	const { data: statuses } = useStatuses()
	const {
		groupFilter,
		statusFilter,
		showOnlyParents,
		entityTypeFilter,
		setGroupFilter,
		setStatusFilter,
		setShowOnlyParents,
		setEntityTypeFilter,
		reset,
	} = useTaskFiltersStore()

	const allTasks = tasks ?? []
	const filters: TaskFilters = {
		groupId: toId(groupFilter),
		statusId: toId(statusFilter),
		showOnlyParents,
		entityType: entityTypeFilter,
	}

	const groupOptions = (groups ?? []).map((group) => ({
		value: String(group.id),
		label: group.name,
	}))
	const statusOptions = (statuses ?? []).map((status) => ({
		value: String(status.id),
		label: status.name,
	}))
	const filteredTasks = filterTasks(allTasks, filters)

	return {
		isLoading,
		filteredTasks,
		groupFilter,
		setGroupFilter,
		statusFilter,
		setStatusFilter,
		showOnlyParents,
		setShowOnlyParents,
		entityTypeFilter,
		setEntityTypeFilter,
		reset,
		groupOptions,
		statusOptions,
	}
}
