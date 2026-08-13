import { Chip } from '@mantine/core'
import { IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react'
import { useActiveTimerState, useStopTimer } from '../api'
import { formatDuration, useTimer } from '../hooks/useTimer'
import { useTimerActions } from '../hooks/useTimerActions'

interface TimerControlProps {
	taskId?: number | null
	duration?: number | null
	startTime?: string | null
	isActiveEntry?: boolean
}

export function TimerControl({ taskId, duration, startTime, isActiveEntry }: TimerControlProps) {
	const { activeEntry, isActiveForTask } = useActiveTimerState(taskId)
	const stopTimer = useStopTimer()
	const { start, switchingId } = useTimerActions()

	const isActive = taskId != null && (isActiveEntry ?? isActiveForTask)
	const tickingStart = isActive ? (activeEntry?.startTime ?? startTime ?? null) : null
	const { elapsed } = useTimer(tickingStart)
	const shown = formatDuration((duration ?? 0) + elapsed)

	const toggle = () => {
		if (taskId == null) return
		if (isActive) stopTimer.mutate(taskId)
		else start(taskId)
	}

	return (
		<Chip
			size='xs'
			variant='filled'
			color='green'
			checked={isActive}
			onChange={toggle}
			disabled={!taskId || switchingId === taskId}
			icon={false}
			styles={{
				label: {
					fontVariantNumeric: 'tabular-nums',
					paddingInline: 'var(--chip-checked-padding)',
				},
			}}
		>
			<span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
				{taskId != null &&
					(isActive ? (
						<IconPlayerStopFilled size={12} style={{ marginRight: 3 }} />
					) : (
						<IconPlayerPlayFilled size={12} style={{ marginRight: 3 }} />
					))}
				{shown}
			</span>
		</Chip>
	)
}
