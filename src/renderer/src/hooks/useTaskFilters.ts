import type { Task } from '../../../shared/api'
import { useCanvasGroups, useProjects, useStatuses, useTasks } from '../api'
import { useTaskFiltersStore } from '../store/taskFilters'

export function filterTasks(
	tasks: Task[],
	projectFilter: string | null,
	groupFilter: string | null,
	statusFilter: string | null,
): Task[] {
	return tasks.filter(
		(t) =>
			(projectFilter == null || t.projectId === Number(projectFilter)) &&
			(groupFilter == null || t.groupId === Number(groupFilter)) &&
			(statusFilter == null || t.statusId === Number(statusFilter)),
	)
}

export function useTaskFilters() {
	const { data: tasks, isLoading } = useTasks()
	const { data: projects } = useProjects()
	const { data: groups } = useCanvasGroups()
	const { data: statuses } = useStatuses()
	const { projectFilter, groupFilter, statusFilter, setProjectFilter, setGroupFilter, setStatusFilter, reset } =
		useTaskFiltersStore()

	const tasksList = tasks ?? []

	const projectOptions = (projects ?? []).map((p) => {
		const value = String(p.id)
		const disabled = value !== projectFilter && filterTasks(tasksList, value, groupFilter, statusFilter).length === 0
		return { value, label: p.name, disabled }
	})
	const groupOptions = (groups ?? []).map((g) => {
		const value = String(g.id)
		const disabled = value !== groupFilter && filterTasks(tasksList, projectFilter, value, statusFilter).length === 0
		return { value, label: g.name, disabled }
	})
	const statusOptions = (statuses ?? []).map((s) => {
		const value = String(s.id)
		const disabled = value !== statusFilter && filterTasks(tasksList, projectFilter, groupFilter, value).length === 0
		return { value, label: s.name, disabled }
	})
	const filteredTasks = filterTasks(tasksList, projectFilter, groupFilter, statusFilter)

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
