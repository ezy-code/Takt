import { Group, Paper, Stack, Text, Badge } from '@mantine/core'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { Status, Task } from '../types'

interface KanbanColumnProps {
  status: Status
  tasks: Task[]
}

export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isColDragging,
  } = useSortable({
    id: `column-${status.id}`,
    data: { type: 'column', statusId: status.id },
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `col-body-${status.id}`,
    data: { type: 'column', statusId: status.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isColDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setSortableRef} style={style}>
      <Paper
        withBorder
        p="sm"
        style={{
          minWidth: 300,
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 140px)',
        }}
      >
        <Group
          justify="space-between"
          mb="sm"
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab' }}
        >
          <Group gap="xs">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: status.color,
                flexShrink: 0,
              }}
            />
            <Text fw={600} size="sm">
              {status.name}
            </Text>
          </Group>
          <Badge size="sm" variant="light">
            {tasks.length}
          </Badge>
        </Group>

        <div
          ref={setDroppableRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 60,
            outline: isOver ? '2px solid var(--mantine-color-blue-6)' : undefined,
          }}
        >
          <SortableContext items={tasks.map((t) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl" style={{ pointerEvents: 'none' }}>
                Drop tasks here
              </Text>
            ) : (
              <Stack gap="xs">
                {tasks.map((task) => (
                  <KanbanCard key={task.id} task={task} />
                ))}
              </Stack>
            )}
          </SortableContext>
        </div>
      </Paper>
    </div>
  )
}
