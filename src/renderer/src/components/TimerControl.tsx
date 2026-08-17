import { Chip } from '@mantine/core'
import { IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react'
import { useActiveTimerState, useStopTimer } from '../api'
import { formatDuration, useTimer } from '../hooks/useTimer'
import { useTimerActions } from '../hooks/useTimerActions'

interface TimerControlProps {
	itemId?: number | null
	duration?: number | null
	startTime?: string | null
	isActiveEntry?: boolean
}

export function TimerControl({ itemId, duration, startTime, isActiveEntry }: TimerControlProps) {
	const { activeEntry, isActiveForItem } = useActiveTimerState(itemId)
	const stopTimer = useStopTimer()
	const { start, switchingId } = useTimerActions()

	const isActive = itemId != null && (isActiveEntry ?? isActiveForItem)
	const tickingStart = isActive ? (activeEntry?.startTime ?? startTime ?? null) : null
	const { elapsed } = useTimer(tickingStart)
	const shown = formatDuration((duration ?? 0) + elapsed)

	const toggle = () => {
		if (itemId == null) return
		if (isActive) stopTimer.mutate(itemId)
		else start(itemId)
	}

	return (
		<Chip
			size='xs'
			variant='filled'
			color='green'
			checked={isActive}
			onChange={toggle}
			disabled={!itemId || switchingId === itemId}
			icon={false}
			styles={{
				label: {
					fontVariantNumeric: 'tabular-nums',
					paddingInline: 'var(--chip-checked-padding)',
				},
			}}
		>
			<span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
				{itemId != null &&
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
