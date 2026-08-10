import { Modal } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useTimeEntries } from '../api'
import type { Task } from '../types'
import { TaskTimeEntries } from './TaskTimeEntries'

interface TaskTimeEntriesModalProps {
	task: Task
	onClose: () => void
}

export function TaskTimeEntriesModal({ task, onClose }: TaskTimeEntriesModalProps) {
	const { t } = useTranslation()
	const { data: entries = [] } = useTimeEntries()

	const taskEntries = entries
		.filter((e) => e.taskId === task.id)
		.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

	return (
		<Modal opened onClose={onClose} title={t('timeEntries.title')} size='lg'>
			<TaskTimeEntries taskName={task.name} entries={taskEntries} defaultOpen />
		</Modal>
	)
}
