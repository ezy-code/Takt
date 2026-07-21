import { ActionIcon, Paper } from '@mantine/core'
import { IconGripVertical } from '@tabler/icons-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface KanbanCardProps {
  task: Task
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', taskId: task.id, statusId: task.statusId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative' as const,
  }

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style}>
        <Paper withBorder p="sm" radius="md" style={{ opacity: 0.3, borderStyle: 'dashed' }} />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ position: 'absolute', top: 4, left: 2, zIndex: 2 }} {...listeners}>
        <ActionIcon variant="subtle" color="gray" size="sm" component="div">
          <IconGripVertical size={14} />
        </ActionIcon>
      </div>
      <TaskCard task={task} />
    </div>
  )
}
