import { useEffect, useState } from 'react'
import { formatDuration } from '../../../shared/formatDuration'

export { formatDuration }

export function useTimer(startTime: string | null) {
	const [elapsed, setElapsed] = useState(0)

	useEffect(() => {
		if (!startTime) {
			setElapsed(0)
			return
		}

		const update = () => {
			const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
			setElapsed(Math.max(0, diff))
		}

		update()
		const id = setInterval(update, 1000)
		return () => clearInterval(id)
	}, [startTime])

	return { display: formatDuration(elapsed), elapsed }
}
