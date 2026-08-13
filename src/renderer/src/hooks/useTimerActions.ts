import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ActiveTimerInfo } from '../../../shared/api'
import { queryKeys, useStartTimer, useStopTimer } from '../api'

export function useTimerActions() {
	const queryClient = useQueryClient()
	const startTimer = useStartTimer()
	const stopTimer = useStopTimer()
	const [switchingId, setSwitchingId] = useState<number | null>(null)

	const start = async (taskId: number) => {
		setSwitchingId(taskId)
		try {
			const active = queryClient.getQueryData<ActiveTimerInfo | null>(queryKeys.activeTimer)
			const activeEntry = active?.entry
			if (activeEntry) await stopTimer.mutateAsync(activeEntry.taskId)
			await startTimer.mutateAsync(taskId)
		} finally {
			setSwitchingId(null)
		}
	}

	return { start, stop: stopTimer.mutate, switchingId }
}
