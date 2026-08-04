import { memo, useMemo } from 'react'
import { Group, Paper, Stack, Text, Badge } from '@mantine/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanCard } from './KanbanCard'
import type { Status, Task } from '../types'

interface KanbanColumnProps {
  status: Status
  tasks: Task[]
}

export const KanbanColumn = memo(function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${status.id}`,
    data: { type: 'column', status },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const itemIds = useMemo(() => tasks.map((t) => `task-${t.id}`), [tasks])

    return (
    <div ref={setNodeRef} style={style}>
      <Paper
        withBorder
        p="sm"
        style={{
          minWidth: 300,
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
            maxHeight: 'calc(100vh - 140px)',
            height: '100%',

        }}
      >
        <Group
          justify="space-between"
          mb="sm"
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', userSelect: 'none' }}
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
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 100,
            borderRadius: 8,
            scrollbarGutter: 'stable',
          }}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap="xs" style={{ minHeight: 100 }}>
              {tasks.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="xl" style={{ pointerEvents: 'none' }}>
                  Drop tasks here
                </Text>
              ) : (
                tasks.map((task) => <KanbanCard key={task.id} task={task} />)
              )}
            </Stack>
          </SortableContext>
        </div>
      </Paper>
    </div>
  )
})
