import { useState } from 'react'
import { useStartTimer, useStopTimer } from '../api'
import { useTimerStore } from '../store/timer'

export function useTimerActions() {
	const startTimer = useStartTimer()
	const stopTimer = useStopTimer()
	const [switchingId, setSwitchingId] = useState<number | null>(null)

	const start = async (taskId: number) => {
		setSwitchingId(taskId)
		try {
			const activeEntry = useTimerStore.getState().activeEntry
			if (activeEntry) await stopTimer.mutateAsync(activeEntry.taskId)
			await startTimer.mutateAsync(taskId)
		} finally {
			setSwitchingId(null)
		}
	}

	return { start, stop: stopTimer.mutate, switchingId }
}
