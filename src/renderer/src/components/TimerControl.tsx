import { ActionIcon, Box, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react'
import { useState } from 'react'
import { useStartTimer, useStopTimer } from '../api'
import { formatDuration, useTimer } from '../hooks/useTimer'
import { useTimerStore } from '../store/timer'
import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TimerControlProps {
	taskId?: number
	duration?: number | null
	startTime?: string | null
}

function TimerDot() {
	return (
		<Box
			style={{
				width: 4,
				height: 4,
				borderRadius: '50%',
				backgroundColor: 'var(--mantine-color-green-6)',
				flexShrink: 0,
			}}
		/>
	)
}

export function TimerControl({ taskId, duration, startTime: propStartTime }: TimerControlProps) {
	const { activeEntry, activeTask } = useTimerStore()
	const startTimer = useStartTimer()
	const stopTimer = useStopTimer()
	const [conflict, setConflict] = useState(false)

	const isActive = taskId ? activeEntry?.taskId === taskId : false
	const liveStartTime = isActive ? activeEntry!.startTime : (propStartTime ?? null)
	const { display, elapsed } = useTimer(liveStartTime)

	if (!taskId) {
		return (
			<Group gap={6} wrap='nowrap' align='center'>
				{propStartTime && <TimerDot />}
				<Text size='sm' fw={700} c={propStartTime ? 'green' : 'blue'} style={{ fontVariantNumeric: 'tabular-nums' }}>
					{propStartTime ? display : formatDuration(duration ?? 0)}
				</Text>
			</Group>
		)
	}

	if (isActive) {
		return (
			<Group gap={6} wrap='nowrap'>
				<TimerDot />
				<Text size='sm' fw={700} c='green' style={{ fontVariantNumeric: 'tabular-nums' }}>
					{formatDuration((duration ?? 0) + elapsed)}
				</Text>
				<ActionIcon color='red' variant='filled' size='sm' onClick={() => stopTimer.mutate(taskId)}>
					<IconPlayerStopFilled size={14} />
				</ActionIcon>
			</Group>
		)
	}

	const handleStart = async () => {
		if (activeEntry) {
			setConflict(true)
			return
		}
		await startTimer.mutateAsync(taskId)
	}

	const handleStopAndStart = async () => {
		if (!activeEntry) return
		await stopTimer.mutateAsync(activeEntry.taskId)
		await startTimer.mutateAsync(taskId)
		setConflict(false)
	}

	return (
		<>
			<Group gap={6} wrap='nowrap'>
				<Text size='sm' c='blue' style={{ fontVariantNumeric: 'tabular-nums' }}>
					{formatDuration(duration ?? 0)}
				</Text>
				<ActionIcon color='green' variant='filled' size='sm' onClick={handleStart}>
					<IconPlayerPlayFilled size={14} />
				</ActionIcon>
			</Group>

			{conflict && activeEntry && (
				<ConflictModal activeTask={activeTask} onClose={() => setConflict(false)} onStopAndStart={handleStopAndStart} />
			)}
		</>
	)
}

interface ConflictModalProps {
	activeTask: Task | null
	onClose: () => void
	onStopAndStart: () => Promise<void>
}

function ConflictModal({ activeTask, onClose, onStopAndStart }: ConflictModalProps) {
	if (!activeTask) return null

	return (
		<Modal opened onClose={onClose} title='Timer already running' size='md'>
			<Stack>
				<TaskCard task={activeTask} />
				<Group justify='flex-end' mt='md'>
					<Button variant='default' onClick={onClose}>
						Cancel
					</Button>
					<Button color='red' onClick={onStopAndStart}>
						Stop & Start New
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
