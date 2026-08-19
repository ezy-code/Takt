import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type {
	AddGroupPayload,
	AddItemPayload,
	UpdateGroupPayload,
	UpdateItemPayload,
	UpdateTimeEntryPayload,
} from '../../shared/api'
import { META_CURRENCY_KEY, META_DEFAULT_RATE_KEY } from '../../shared/constants'
import { costOf } from '../../shared/cost'
import type { Item, StartTimerResult } from './types'

export const queryKeys = {
	items: ['items'] as const,
	myDayItems: ['items', 'my-day'] as const,
	groups: ['groups'] as const,
	activeTimer: ['active-timer'] as const,
	lastTimer: ['last-timer'] as const,
	timeEntries: ['time-entries'] as const,
	timeSummary: ['time-summary'] as const,
	statuses: ['statuses'] as const,
	entityChildren: (parentId: number) => ['entity-children', parentId] as const,
	entityAncestors: (entityId: number) => ['entity-ancestors', entityId] as const,
	entitySearch: (query: string, limit: number) => ['entity-search', query, limit] as const,
}

export function useItems() {
	return useQuery({
		queryKey: queryKeys.items,
		queryFn: () => window.api.getItems(),
	})
}

export function useItem(id: number) {
	return useQuery({
		queryKey: ['items', id],
		queryFn: () => window.api.getItem(id),
		enabled: !!id,
	})
}

export function useMyDayItems() {
	return useQuery({
		queryKey: queryKeys.myDayItems,
		queryFn: () => window.api.getMyDayItems(),
	})
}

export function useActiveTimer() {
	return useQuery({
		queryKey: queryKeys.activeTimer,
		queryFn: () => window.api.getActiveTimer(),
	})
}

export function useActiveTimerState(itemId?: number | null) {
	const { data } = useActiveTimer()
	const activeEntry = data?.entry ?? null
	const isActiveForItem = itemId != null && activeEntry?.itemId === itemId
	return {
		activeTimer: data,
		activeEntry,
		isActiveForItem,
		tickingStart: isActiveForItem ? (activeEntry?.startTime ?? null) : null,
	}
}

export function useLastTimer() {
	return useQuery({
		queryKey: queryKeys.lastTimer,
		queryFn: () => window.api.getLastTimer(),
	})
}

export function useTimerChangedSync() {
	const queryClient = useQueryClient()
	useEffect(
		() =>
			window.api.onTimerChanged(() => {
				queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.items })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			}),
		[queryClient],
	)
}

export function useTimeEntries() {
	return useQuery({
		queryKey: queryKeys.timeEntries,
		queryFn: () => window.api.getAllTimeEntries(),
	})
}

export function useTimeSummary() {
	return useQuery({
		queryKey: queryKeys.timeSummary,
		queryFn: () => window.api.getTimeSummary(),
	})
}

export function useAddItem() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: AddItemPayload) => window.api.addItem(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
		},
	})
}

export function useUpdateItem() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: UpdateItemPayload) => window.api.updateItem(payload),
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({ queryKey: ['items', vars.id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
		},
	})
}

export function useDeleteItem() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteItem(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
			queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
		},
	})
}

export function useToggleMyDay() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.toggleMyDayItem(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['items', id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
		},
	})
}

export function useClearMyDay() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.clearMyDayDate(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['items', id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
		},
	})
}

export function useUpdateTimeEntry() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: UpdateTimeEntryPayload) => window.api.updateTimeEntry(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
			queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
		},
	})
}

export function useDeleteTimeEntry() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteTimeEntry(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
		},
	})
}

export function useStartTimer() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (itemId: number) => window.api.startTimer(itemId),
		onSuccess: (result: StartTimerResult) => {
			if (!result.conflict) {
				queryClient.setQueryData(queryKeys.activeTimer, { entry: result.entry, item: result.item })
				queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.items })
				queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			}
		},
	})
}

export function useStopTimer() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (itemId: number) => window.api.stopTimer(itemId),
		onSuccess: (result, itemId) => {
			if (result) {
				const patchItem = (t: Item): Item => {
					const totalDuration = (t.totalDuration ?? 0) + (result.entry.duration ?? 0)
					return { ...t, totalDuration, cost: costOf(totalDuration, t.rate ?? 0) }
				}
				const listUpdater = (items: Item[] | undefined) => {
					if (!items) return items
					return items.map((t) => (t.id === itemId ? patchItem(t) : t))
				}
				queryClient.setQueryData(queryKeys.items, listUpdater)
				queryClient.setQueryData(queryKeys.myDayItems, listUpdater)
				queryClient.setQueryData(['items', itemId], (t: Item | undefined) => (t?.id === itemId ? patchItem(t) : t))
				queryClient.setQueryData(queryKeys.activeTimer, null)
				queryClient.setQueryData(queryKeys.lastTimer, result)
			}
			queryClient.invalidateQueries({ queryKey: ['items', itemId] })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
			queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
		},
	})
}

export function useStatuses() {
	return useQuery({
		queryKey: queryKeys.statuses,
		queryFn: () => window.api.getStatuses(),
	})
}

export function useAddStatus() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ name, color }: { name: string; color: string }) => window.api.addStatus(name, color),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.statuses })
		},
	})
}

export function useUpdateStatus() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
			window.api.updateStatus(id, name, color),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.statuses })
		},
	})
}

export function useDeleteStatus() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.statuses })
		},
	})
}

export function useReorderStatuses() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (ids: number[]) => window.api.reorderStatuses(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.statuses })
		},
	})
}

export function useSetDefaultStatus() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.setDefaultStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.statuses })
		},
	})
}

export function useMoveItem() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ itemId, statusId }: { itemId: number; statusId: number }) => window.api.moveItem(itemId, statusId),
		onSuccess: (_data, { itemId }) => {
			queryClient.invalidateQueries({ queryKey: ['items', itemId] })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
		},
	})
}

export function useReorderItems() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ columnId, itemIds }: { columnId: number; itemIds: number[] }) =>
			window.api.reorderItems(columnId, itemIds),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
		},
	})
}

export function useUpdateCanvasPosition() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, x, y }: { id: number; x: number; y: number }) => window.api.updateItemCanvasPosition(id, x, y),
		onSuccess: (_data, { id, x, y }) => {
			const updater = (items: Item[] | undefined) => {
				if (!items) return items
				return items.map((t) => (t.id === id ? { ...t, canvasX: x, canvasY: y } : t))
			}
			queryClient.setQueryData(queryKeys.items, updater)
			queryClient.setQueryData(queryKeys.myDayItems, updater)
		},
	})
}

export function useEntityChildren(parentId: number) {
	return useQuery({
		queryKey: queryKeys.entityChildren(parentId),
		queryFn: () => window.api.getEntityChildren(parentId),
		enabled: !!parentId,
	})
}

export function useEntityAncestors(entityId: number) {
	return useQuery({
		queryKey: queryKeys.entityAncestors(entityId),
		queryFn: () => window.api.getEntityAncestors(entityId),
		enabled: !!entityId,
	})
}

export function useEntitySearch(query: string, limit = 20, enabled = true) {
	return useQuery({
		queryKey: queryKeys.entitySearch(query, limit),
		queryFn: () => window.api.searchEntities(query, limit),
		enabled: enabled && query.trim().length > 0,
		staleTime: 5_000,
		gcTime: 5 * 60_000,
	})
}

export function useGroups() {
	return useQuery({
		queryKey: queryKeys.groups,
		queryFn: () => window.api.getGroups(),
	})
}

export function useAddGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: AddGroupPayload) => window.api.addGroup(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups })
		},
	})
}

export function useUpdateGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: UpdateGroupPayload) => window.api.updateGroup(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups })
		},
	})
}

export function useDeleteGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteGroup(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.groups })
			queryClient.invalidateQueries({ queryKey: queryKeys.items })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayItems })
		},
	})
}

export function useCurrency() {
	return useQuery({
		queryKey: ['meta', META_CURRENCY_KEY],
		queryFn: async () => (await window.api.getMeta(META_CURRENCY_KEY)) ?? '$',
	})
}

export function useDefaultRate() {
	return useQuery({
		queryKey: ['meta', META_DEFAULT_RATE_KEY],
		queryFn: async () => {
			const n = Number(await window.api.getMeta(META_DEFAULT_RATE_KEY))
			return Number.isFinite(n) ? n : 0
		},
	})
}
