import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type {
	AddCanvasGroupPayload,
	AddTaskPayload,
	UpdateCanvasGroupPayload,
	UpdateTaskPayload,
	UpdateTimeEntryPayload,
} from '../../shared/api'
import { META_CURRENCY_KEY, META_DEFAULT_RATE_KEY } from '../../shared/constants'
import { costOf } from '../../shared/cost'
import type { StartTimerResult, Task } from './types'

export const queryKeys = {
	tasks: ['tasks'] as const,
	myDayTasks: ['tasks', 'my-day'] as const,
	taskLinks: ['task-links'] as const,
	taskRelatedItems: (taskId: number) => ['task-related-items', taskId] as const,
	canvasGroups: ['canvas-groups'] as const,
	activeTimer: ['active-timer'] as const,
	lastTimer: ['last-timer'] as const,
	timeEntries: ['time-entries'] as const,
	timeSummary: ['time-summary'] as const,
	statuses: ['statuses'] as const,
	entityChildren: (parentId: number) => ['entity-children', parentId] as const,
	entityAncestors: (entityId: number) => ['entity-ancestors', entityId] as const,
	entitySearch: (query: string, limit: number) => ['entity-search', query, limit] as const,
}

export function useTasks() {
	return useQuery({
		queryKey: queryKeys.tasks,
		queryFn: () => window.api.getTasks(),
	})
}

export function useTask(id: number) {
	return useQuery({
		queryKey: ['tasks', id],
		queryFn: () => window.api.getTask(id),
		enabled: !!id,
	})
}

export function useMyDayTasks() {
	return useQuery({
		queryKey: queryKeys.myDayTasks,
		queryFn: () => window.api.getMyDayTasks(),
	})
}

export function useActiveTimer() {
	return useQuery({
		queryKey: queryKeys.activeTimer,
		queryFn: () => window.api.getActiveTimer(),
	})
}

export function useActiveTimerState(taskId?: number | null) {
	const { data } = useActiveTimer()
	const activeEntry = data?.entry ?? null
	const isActiveForTask = taskId != null && activeEntry?.taskId === taskId
	return {
		activeTimer: data,
		activeEntry,
		isActiveForTask,
		tickingStart: isActiveForTask ? (activeEntry?.startTime ?? null) : null,
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
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
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

export function useAddTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: AddTaskPayload) => window.api.addTask(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
		},
	})
}

export function useUpdateTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: UpdateTaskPayload) => window.api.updateTask(payload),
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', vars.id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
		},
	})
}

export function useDeleteTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteTask(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: ['entity-search'] })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
			queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			queryClient.invalidateQueries({ queryKey: queryKeys.taskLinks })
			queryClient.invalidateQueries({ queryKey: ['task-related-items'] })
			queryClient.invalidateQueries({ queryKey: ['entity-children'] })
			queryClient.invalidateQueries({ queryKey: ['entity-ancestors'] })
		},
	})
}

export function useToggleMyDay() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.toggleMyDayTask(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useClearMyDay() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.clearMyDayDate(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
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
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
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
		mutationFn: (taskId: number) => window.api.startTimer(taskId),
		onSuccess: (result: StartTimerResult) => {
			if (!result.conflict) {
				queryClient.setQueryData(queryKeys.activeTimer, { entry: result.entry, task: result.task })
				queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
				queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries })
				queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary })
			}
		},
	})
}

export function useStopTimer() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (taskId: number) => window.api.stopTimer(taskId),
		onSuccess: (result, taskId) => {
			if (result) {
				const patchTask = (t: Task): Task => {
					const total_duration = (t.total_duration ?? 0) + (result.entry.duration ?? 0)
					return { ...t, total_duration, cost: costOf(total_duration, t.rate ?? 0) }
				}
				const listUpdater = (tasks: Task[] | undefined) => {
					if (!tasks) return tasks
					return tasks.map((t) => (t.id === taskId ? patchTask(t) : t))
				}
				queryClient.setQueryData(queryKeys.tasks, listUpdater)
				queryClient.setQueryData(queryKeys.myDayTasks, listUpdater)
				queryClient.setQueryData(['tasks', taskId], (t: Task | undefined) => (t?.id === taskId ? patchTask(t) : t))
				queryClient.setQueryData(queryKeys.activeTimer, null)
				queryClient.setQueryData(queryKeys.lastTimer, result)
			}
			queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
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

export function useMoveTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ taskId, statusId }: { taskId: number; statusId: number }) => window.api.moveTask(taskId, statusId),
		onSuccess: (_data, { taskId }) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useReorderTasks() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ columnId, taskIds }: { columnId: number; taskIds: number[] }) =>
			window.api.reorderTasks(columnId, taskIds),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useUpdateCanvasPosition() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, x, y }: { id: number; x: number; y: number }) => window.api.updateTaskCanvasPosition(id, x, y),
		onSuccess: (_data, { id, x, y }) => {
			const updater = (tasks: Task[] | undefined) => {
				if (!tasks) return tasks
				return tasks.map((t) => (t.id === id ? { ...t, canvasX: x, canvasY: y } : t))
			}
			queryClient.setQueryData(queryKeys.tasks, updater)
			queryClient.setQueryData(queryKeys.myDayTasks, updater)
		},
	})
}

export function useTaskLinks() {
	return useQuery({
		queryKey: queryKeys.taskLinks,
		queryFn: () => window.api.getTaskLinks(),
	})
}

export function useTaskRelatedItems(taskId: number) {
	return useQuery({
		queryKey: queryKeys.taskRelatedItems(taskId),
		queryFn: () => window.api.getTaskRelatedItems(taskId),
		enabled: !!taskId,
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

export function useAddTaskLink() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ sourceTaskId, targetTaskId }: { sourceTaskId: number; targetTaskId: number }) =>
			window.api.addTaskLink(sourceTaskId, targetTaskId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.taskLinks })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: ['task-related-items'] })
		},
	})
}

export function useDeleteTaskLink() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteTaskLink(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.taskLinks })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: ['task-related-items'] })
		},
	})
}

export function useCanvasGroups() {
	return useQuery({
		queryKey: queryKeys.canvasGroups,
		queryFn: () => window.api.getCanvasGroups(),
	})
}

export function useAddCanvasGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: AddCanvasGroupPayload) => window.api.addCanvasGroup(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.canvasGroups })
		},
	})
}

export function useUpdateCanvasGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: UpdateCanvasGroupPayload) => window.api.updateCanvasGroup(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.canvasGroups })
		},
	})
}

export function useDeleteCanvasGroup() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteCanvasGroup(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.canvasGroups })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useProjectEntities() {
	const query = useTasks()
	return { ...query, data: query.data?.filter((entity) => entity.entityType === 'project') }
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
