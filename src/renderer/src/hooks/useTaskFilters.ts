import type { Task } from '../../../shared/api'
import { useCanvasGroups, useProjectEntities, useStatuses, useTasks } from '../api'
import { useTaskFiltersStore } from '../store/taskFilters'

type TaskFilters = {
	projectId: number | null
	groupId: number | null
	statusId: number | null
	showOnlyParents: boolean
	entityType: 'task' | 'note' | 'project' | null
}

function toId(value: string | null): number | null {
	return value == null ? null : Number(value)
}

function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
	const byId = new Map(tasks.map((task) => [task.id, task]))
	const parentIds = new Set(tasks.flatMap((task) => (task.parentId == null ? [] : [task.parentId])))
	const isInProject = (task: Task, projectId: number) => {
		let parentId = task.parentId
		const visited = new Set<number>()
		while (parentId != null && !visited.has(parentId)) {
			visited.add(parentId)
			if (parentId === projectId) return true
			parentId = byId.get(parentId)?.parentId
		}
		return false
	}

	return tasks.filter(
		(task) =>
			(filters.projectId == null || isInProject(task, filters.projectId)) &&
			(filters.groupId == null || task.groupId === filters.groupId) &&
			(filters.statusId == null || task.statusId === filters.statusId) &&
			(!filters.showOnlyParents || parentIds.has(task.id)) &&
			(filters.entityType == null || (task.entityType ?? 'task') === filters.entityType),
	)
}

export function useTaskFilters() {
	const { data: tasks, isLoading } = useTasks()
	const { data: projects } = useProjectEntities()
	const { data: groups } = useCanvasGroups()
	const { data: statuses } = useStatuses()
	const {
		projectFilter,
		groupFilter,
		statusFilter,
		showOnlyParents,
		entityTypeFilter,
		setProjectFilter,
		setGroupFilter,
		setStatusFilter,
		setShowOnlyParents,
		setEntityTypeFilter,
		reset,
	} = useTaskFiltersStore()

	const allTasks = tasks ?? []
	const filters: TaskFilters = {
		projectId: toId(projectFilter),
		groupId: toId(groupFilter),
		statusId: toId(statusFilter),
		showOnlyParents,
		entityType: entityTypeFilter,
	}

	const projectOptions = (projects ?? []).map((project) => ({
		value: String(project.id),
		label: project.name,
	}))
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
		projectFilter,
		setProjectFilter,
		groupFilter,
		setGroupFilter,
		statusFilter,
		setStatusFilter,
		showOnlyParents,
		setShowOnlyParents,
		entityTypeFilter,
		setEntityTypeFilter,
		reset,
		projectOptions,
		groupOptions,
		statusOptions,
	}
}
