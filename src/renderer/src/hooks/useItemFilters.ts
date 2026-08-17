import type { Item } from '../../../shared/api'
import { useGroups, useItems, useStatuses } from '../api'
import { useItemFiltersStore } from '../store/itemFilters'

type ItemFilters = {
	groupId: number | null
	statusId: number | null
	showOnlyParents: boolean
	entityType: 'task' | 'note' | null
}

function toId(value: string | null): number | null {
	return value == null ? null : Number(value)
}

function filterItems(items: Item[], filters: ItemFilters): Item[] {
	const parentIds = new Set(items.flatMap((item) => (item.parentId == null ? [] : [item.parentId])))

	return items.filter(
		(item) =>
			(filters.groupId == null || item.groupId === filters.groupId) &&
			(filters.statusId == null || item.statusId === filters.statusId) &&
			(!filters.showOnlyParents || parentIds.has(item.id)) &&
			(filters.entityType == null || (item.entityType ?? 'task') === filters.entityType),
	)
}

export function useItemFilters() {
	const { data: items, isLoading } = useItems()
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
	} = useItemFiltersStore()

	const allItems = items ?? []
	const filters: ItemFilters = {
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
	const filteredItems = filterItems(allItems, filters)

	return {
		isLoading,
		filteredItems,
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
