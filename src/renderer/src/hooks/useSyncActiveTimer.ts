import { useEffect } from 'react'
import { useActiveTimer } from '../api'
import { useTimerStore } from '../store/timer'

/**
 * Subscribes to the active timer from the main process and mirrors it into the
 * shared timer store. Components that only need to read status can use its
 * return value directly.
 */
export function useSyncActiveTimer() {
	const { data: activeTimer } = useActiveTimer()
	const setActive = useTimerStore((s) => s.setActive)

	useEffect(() => {
		setActive(activeTimer ? activeTimer.entry : null, activeTimer ? activeTimer.task : null)
	}, [activeTimer, setActive])

	return activeTimer
}
