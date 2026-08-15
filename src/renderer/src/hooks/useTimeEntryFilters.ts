import type { TimeEntryWithTask } from '../../../shared/api'
import { useProjects, useTasks, useTimeEntries } from '../api'
import { useTimeEntryFiltersStore } from '../store/timeEntryFilters'

function startOfDay(date: string): number {
	return new Date(`${date}T00:00:00`).getTime()
}

function localDayStart(iso: string): number {
	const d = new Date(iso)
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function filterTimeEntries(
	entries: TimeEntryWithTask[],
	projectFilter: string | null,
	taskFilter: string | null,
	dateFrom: string | null,
	dateTo: string | null,
): TimeEntryWithTask[] {
	const projectId = projectFilter ? Number(projectFilter) : null
	return entries.filter((entry) => {
		if (projectId != null && entry.projectId !== projectId) return false
		if (taskFilter && entry.taskId !== Number(taskFilter)) return false
		const ts = localDayStart(entry.startTime)
		if (dateFrom && ts < startOfDay(dateFrom)) return false
		if (dateTo && ts > startOfDay(dateTo)) return false
		return true
	})
}

export function useTimeEntryFilters() {
	const { data: entries = [] } = useTimeEntries()
	const { data: projects = [] } = useProjects()
	const { data: tasks = [] } = useTasks()
	const {
		projectFilter,
		taskFilter,
		dateFrom,
		dateTo,
		setProjectFilter,
		setTaskFilter,
		setDateFrom,
		setDateTo,
		reset,
	} = useTimeEntryFiltersStore()

	const taskOptions = tasks
		.filter((task) => task.id != null)
		.map((task) => ({ value: String(task.id), label: task.name }))

	const handleProjectChange = (value: string | null) => {
		setProjectFilter(value)
	}

	const filteredEntries = filterTimeEntries(entries, projectFilter, taskFilter, dateFrom, dateTo)
	const filteredDuration = filteredEntries.reduce((acc, e) => acc + (e.duration ?? 0), 0)
	const filteredCost = filteredEntries.reduce((acc, e) => acc + (e.cost ?? 0), 0)

	return {
		projectFilter,
		taskFilter,
		dateFrom,
		dateTo,
		projectOptions: projects.map((p) => ({ value: String(p.id), label: p.name })),
		taskOptions,
		handleProjectChange,
		setTaskFilter,
		setDateFrom,
		setDateTo,
		filteredEntries,
		filteredDuration,
		filteredCost,
		entriesCount: entries.length,
		reset,
	}
}
