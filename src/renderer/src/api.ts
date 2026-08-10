import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTimerStore } from './store/timer'
import type { StartTimerResult, Task, TimeEntry } from './types'

const queryKeys = {
	tasks: ['tasks'] as const,
	myDayTasks: ['tasks', 'my-day'] as const,
	activeTimer: ['active-timer'] as const,
	lastTimer: ['last-timer'] as const,
	timeEntries: ['time-entries'] as const,
	timeSummary: ['time-summary'] as const,
	statuses: ['statuses'] as const,
	projects: ['projects'] as const,
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

export function useLastTimer() {
	return useQuery({
		queryKey: queryKeys.lastTimer,
		queryFn: () => window.api.getLastTimer(),
	})
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
		mutationFn: ({
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
		}: {
			name: string
			description: string
			description_md?: string
			description_html?: string
			statusId?: number
			projectId?: number
			myDay?: boolean
			reminderAt?: string | null
		}) =>
			window.api.addTask(name, description, description_md, description_html, statusId, projectId, myDay, reminderAt),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useUpdateTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			name,
			description,
			description_md,
			description_html,
			statusId,
			projectId,
			myDay,
			reminderAt,
		}: {
			id: number
			name: string
			description: string
			description_md?: string
			description_html?: string
			statusId?: number
			projectId?: number
			myDay?: boolean
			reminderAt?: string | null
		}) =>
			window.api.updateTask(
				id,
				name,
				description,
				description_md,
				description_html,
				statusId,
				projectId,
				myDay,
				reminderAt,
			),
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', vars.id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
		},
	})
}

export function useDeleteTask() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => window.api.deleteTask(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
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
	const setActive = useTimerStore((s) => s.setActive)
	return useMutation({
		mutationFn: (taskId: number) => window.api.startTimer(taskId),
		onSuccess: (result: StartTimerResult) => {
			if (!result.conflict) {
				setActive(result.entry, null)
				queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.lastTimer })
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
				queryClient.invalidateQueries({ queryKey: queryKeys.myDayTasks })
			}
		},
	})
}

export function useStopTimer() {
	const queryClient = useQueryClient()
	const setActive = useTimerStore((s) => s.setActive)
	return useMutation({
		mutationFn: (taskId: number) => window.api.stopTimer(taskId),
		onSuccess: (result: TimeEntry | null, taskId: number) => {
			setActive(null, null)
			if (result?.duration) {
				const updater = (tasks: Task[] | undefined) => {
					if (!tasks) return tasks
					return tasks.map((t) =>
						t.id === taskId ? { ...t, total_duration: (t.total_duration ?? 0) + (result.duration ?? 0) } : t,
					)
				}
				queryClient.setQueryData(queryKeys.tasks, updater)
				queryClient.setQueryData(queryKeys.myDayTasks, updater)
			}
			queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
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

export function useProjects() {
	return useQuery({
		queryKey: queryKeys.projects,
		queryFn: () => window.api.getProjects(),
	})
}

export function useProject(id: number) {
	return useQuery({
		queryKey: ['projects', id],
		queryFn: () => window.api.getProject(id),
		enabled: !!id,
	})
}

export function useAddProject() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			name,
			description,
			description_md,
			description_html,
		}: {
			name: string
			description?: string
			description_md?: string
			description_html?: string
		}) => window.api.addProject(name, description, description_md, description_html),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.projects })
		},
	})
}

export function useUpdateProject() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			name,
			description,
			description_md,
			description_html,
		}: {
			id: number
			name: string
			description?: string
			description_md?: string
			description_html?: string
		}) => window.api.updateProject(id, name, description, description_md, description_html),
		onSuccess: (_data, vars) => {
			queryClient.invalidateQueries({ queryKey: ['projects', vars.id] })
			queryClient.invalidateQueries({ queryKey: queryKeys.projects })
		},
	})
}
