import type { Task, TimeEntryWithTask } from '../../../shared/api'
import { useTasks, useTimeEntries } from '../api'
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
	taskFilter: string | null,
	dateFrom: string | null,
	dateTo: string | null,
): TimeEntryWithTask[] {
	return entries.filter((entry) => {
		if (taskFilter && entry.taskId !== Number(taskFilter)) return false
		const ts = localDayStart(entry.startTime)
		if (dateFrom && ts < startOfDay(dateFrom)) return false
		if (dateTo && ts > startOfDay(dateTo)) return false
		return true
	})
}

export function useTimeEntryFilters() {
	const { data: entries = [] } = useTimeEntries()
	const { data: tasks = [] } = useTasks()
	const { taskFilter, dateFrom, dateTo, setTaskFilter, setDateFrom, setDateTo, reset } = useTimeEntryFiltersStore()

	const taskOptions = tasks
		.filter((task) => task.id != null)
		.map((task) => ({ value: String(task.id), label: task.name }))

	const filteredEntries = filterTimeEntries(entries, taskFilter, dateFrom, dateTo)
	const filteredDuration = filteredEntries.reduce((acc, e) => acc + (e.duration ?? 0), 0)
	const filteredCost = filteredEntries.reduce((acc, e) => acc + (e.cost ?? 0), 0)

	return {
		taskFilter,
		dateFrom,
		dateTo,
		taskOptions,
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
