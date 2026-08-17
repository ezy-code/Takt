import type { Item, TimeEntryWithItem } from '../../../shared/api'
import { useItems, useTimeEntries } from '../api'
import { useTimeEntryFiltersStore } from '../store/timeEntryFilters'

function startOfDay(date: string): number {
	return new Date(`${date}T00:00:00`).getTime()
}

function localDayStart(iso: string): number {
	const d = new Date(iso)
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function filterTimeEntries(
	entries: TimeEntryWithItem[],
	itemFilter: string | null,
	dateFrom: string | null,
	dateTo: string | null,
): TimeEntryWithItem[] {
	return entries.filter((entry) => {
		if (itemFilter && entry.itemId !== Number(itemFilter)) return false
		const ts = localDayStart(entry.startTime)
		if (dateFrom && ts < startOfDay(dateFrom)) return false
		if (dateTo && ts > startOfDay(dateTo)) return false
		return true
	})
}

export function useTimeEntryFilters() {
	const { data: entries = [] } = useTimeEntries()
	const { data: items = [] } = useItems()
	const { itemFilter, dateFrom, dateTo, setItemFilter, setDateFrom, setDateTo, reset } = useTimeEntryFiltersStore()

	const itemOptions = items
		.filter((item) => item.id != null)
		.map((item) => ({ value: String(item.id), label: item.name }))

	const filteredEntries = filterTimeEntries(entries, itemFilter, dateFrom, dateTo)
	const filteredDuration = filteredEntries.reduce((acc, e) => acc + (e.duration ?? 0), 0)
	const filteredCost = filteredEntries.reduce((acc, e) => acc + (e.cost ?? 0), 0)

	return {
		itemFilter,
		dateFrom,
		dateTo,
		itemOptions,
		setItemFilter,
		setDateFrom,
		setDateTo,
		filteredEntries,
		filteredDuration,
		filteredCost,
		entriesCount: entries.length,
		reset,
	}
}
