import type { Task } from '../../../shared/api'
import { useCanvasGroups, useProjects, useStatuses, useTasks } from '../api'
import { useTaskFiltersStore } from '../store/taskFilters'

type TaskFilters = {
	projectId: number | null
	groupId: number | null
	statusId: number | null
}

function toId(value: string | null): number | null {
	return value == null ? null : Number(value)
}

function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
	return tasks.filter(
		(task) =>
			(filters.projectId == null || task.projectId === filters.projectId) &&
			(filters.groupId == null || task.groupId === filters.groupId) &&
			(filters.statusId == null || task.statusId === filters.statusId),
	)
}

export function useTaskFilters() {
	const { data: tasks, isLoading } = useTasks()
	const { data: projects } = useProjects()
	const { data: groups } = useCanvasGroups()
	const { data: statuses } = useStatuses()
	const { projectFilter, groupFilter, statusFilter, setProjectFilter, setGroupFilter, setStatusFilter, reset } =
		useTaskFiltersStore()

	const allTasks = tasks ?? []
	const filters: TaskFilters = {
		projectId: toId(projectFilter),
		groupId: toId(groupFilter),
		statusId: toId(statusFilter),
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
		reset,
		projectOptions,
		groupOptions,
		statusOptions,
	}
}
