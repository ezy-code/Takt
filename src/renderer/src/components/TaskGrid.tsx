import { SimpleGrid } from '@mantine/core'
import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskGridProps {
	tasks: Task[]
}

export function TaskGrid({ tasks }: TaskGridProps) {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
			{tasks.map((task) => (
				<TaskCard key={task.id} task={task} />
			))}
		</SimpleGrid>
	)
}
