import { useState, useEffect } from 'react'
import { Group, ScrollArea, Text, Loader } from '@mantine/core'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useTasks, useStatuses, useMoveTask, useReorderStatuses } from '../api'
import { KanbanColumn } from './KanbanColumn'
import { AddStatusColumn } from './AddStatusColumn'
import { TaskCard } from './TaskCard'
import type { Task, Status } from '../types'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'

export function KanbanBoard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Status[]>([])
  const [columnTasks, setColumnTasks] = useState<Record<number, Task[]>>({})
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const { data: statuses, isLoading: statusesLoading } = useStatuses()
  const moveTask = useMoveTask()
  const reorderStatuses = useReorderStatuses()

  useEffect(() => {
    if (statuses) setLocalStatuses(statuses)
  }, [statuses])

  useEffect(() => {
    if (!statuses || !tasks) return
    const grouped: Record<number, Task[]> = {}
    for (const s of statuses) {
      grouped[s.id] = (tasks ?? []).filter((t) => (t.statusId ?? null) === s.id)
    }
    setColumnTasks(grouped)
  }, [statuses, tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'task') {
      const task = (tasks ?? []).find((t) => t.id === data.taskId)
      setActiveTask(task ?? null)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type !== 'task') return

    const overCol = overData?.type === 'column' ? overData.statusId
      : overData?.type === 'task' ? (overData as { statusId: number }).statusId
      : null

    const activeCol = activeData.statusId as number
    if (!overCol || activeCol === overCol) return

    setColumnTasks((prev) => {
      const moved = prev[activeCol]?.find((t) => t.id === activeData.taskId)
      if (!moved) return prev
      const dest = [...(prev[overCol] ?? [])]
      let insertAt = dest.length
      if (overData?.type === 'task') {
        const idx = dest.findIndex((t) => `task-${t.id}` === over.id)
        if (idx !== -1) insertAt = idx
      }
      dest.splice(insertAt, 0, { ...moved, statusId: overCol })
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter((t) => t.id !== activeData.taskId),
        [overCol]: dest,
      }
    })
    active.data.current = { ...activeData, statusId: overCol }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData) return

    if (activeData.type === 'column') {
      if (active.id === over.id) return
      const oldIndex = localStatuses.findIndex((s) => `column-${s.id}` === active.id)
      const newIndex = localStatuses.findIndex((s) => `column-${s.id}` === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(localStatuses, oldIndex, newIndex)
      setLocalStatuses(reordered)
      reorderStatuses.mutate(reordered.map((s) => s.id))
      return
    }

    if (activeData.type === 'task' && overData?.type === 'column') {
      moveTask.mutate({ taskId: activeData.taskId as number, statusId: overData.statusId as number })
    }
  }

  if (tasksLoading || statusesLoading) {
    return <Loader mt="xl" />
  }

  if (!statuses || statuses.length === 0) {
    return <Text c="dimmed" mt="xl">No statuses yet. Create one in Manage Statuses.</Text>
  }

  return (
    <ScrollArea>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Group wrap="nowrap" align="flex-start" gap="md">
          <SortableContext
            items={localStatuses.map((s) => `column-${s.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {localStatuses.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={columnTasks[status.id] ?? []}
              />
            ))}
          </SortableContext>
          <AddStatusColumn />
        </Group>
        <DragOverlay>
          {activeTask ? (
            <div style={{ width: 300 }}>
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ScrollArea>
  )
}
