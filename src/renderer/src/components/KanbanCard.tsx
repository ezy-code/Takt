import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface KanbanCardProps {
	task: Task
}

export const KanbanCard = memo(function KanbanCard({ task }: KanbanCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `task-${task.id}`,
		data: { type: 'task', task },
	})

	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.2 : 1,
		userSelect: 'none',
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<TaskCard task={task} />
		</div>
	)
})
