import { useState, useEffect, useRef, useCallback } from 'react'
import { Group, ScrollArea, Text, Loader } from '@mantine/core'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useTasks, useStatuses, useMoveTask, useReorderStatuses, useReorderTasks } from '../api'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { AddStatusColumn } from './AddStatusColumn'
import type { Task, Status } from '../types'

export function KanbanBoard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<Status | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Status[]>([])
  const [columnTasks, setColumnTasks] = useState<Record<number, Task[]>>({})

  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const { data: statuses, isLoading: statusesLoading } = useStatuses()
  const moveTask = useMoveTask()
  const reorderStatuses = useReorderStatuses()
  const reorderTasks = useReorderTasks()

  const dragOrigin = useRef<{ taskId: number; statusId: number } | null>(null)
  const isDraggingRef = useRef(false)
  isDraggingRef.current = activeTask != null

  useEffect(() => {
    if (statuses) setLocalStatuses(statuses)
  }, [statuses])

  useEffect(() => {
    if (isDraggingRef.current) return
    if (!statuses || !tasks) return

    const grouped: Record<number, Task[]> = {}
    for (const s of statuses) {
      grouped[s.id] = (tasks ?? []).filter((t) => (t.statusId ?? null) === s.id)
    }
    setColumnTasks(grouped)
  }, [statuses, tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const findContainer = useCallback(
    (id: UniqueIdentifier): number | null => {
      const idStr = String(id)

      if (idStr.startsWith('column-')) {
        return Number(idStr.replace('column-', ''))
      }

      for (const [statusId, taskList] of Object.entries(columnTasks)) {
        if (taskList.some((t) => `task-${t.id}` === idStr)) {
          return Number(statusId)
        }
      }

      return null
    },
    [columnTasks]
  )

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === 'column') {
      return closestCorners(args)
    }

    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current

    if (data?.type === 'task') {
      const task = data.task as Task
      setActiveTask(task)
      dragOrigin.current = { taskId: task.id, statusId: task.statusId }
    } else if (data?.type === 'column') {
      setActiveColumn(data.status as Status)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type !== 'task') return

    const activeContainer = findContainer(activeId)
    const overContainer = overData?.type === 'column'
      ? (overData.statusId ?? overData.status?.id)
      : findContainer(overId)

    if (!activeContainer || !overContainer) return

    if (activeContainer !== overContainer) {
      setColumnTasks((prev) => {
        const activeItems = prev[activeContainer] ?? []
        const overItems = prev[overContainer] ?? []

        const activeIndex = activeItems.findIndex((t) => `task-${t.id}` === activeId)
        if (activeIndex === -1) return prev

        const taskToMove = activeItems[activeIndex]
        const updatedTask = { ...taskToMove, statusId: overContainer }

        let overIndex = overData?.type === 'task'
          ? overItems.findIndex((t) => `task-${t.id}` === overId)
          : overItems.length

        if (overIndex === -1) overIndex = overItems.length

        return {
          ...prev,
          [activeContainer]: activeItems.filter((t) => `task-${t.id}` !== activeId),
          [overContainer]: [
            ...overItems.slice(0, overIndex),
            updatedTask,
            ...overItems.slice(overIndex),
          ],
        }
      })
    }
    else if (overData?.type === 'task') {
      setColumnTasks((prev) => {
        const items = prev[activeContainer] ?? []
        const oldIndex = items.findIndex((t) => `task-${t.id}` === activeId)
        const newIndex = items.findIndex((t) => `task-${t.id}` === overId)

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          return {
            ...prev,
            [activeContainer]: arrayMove(items, oldIndex, newIndex),
          }
        }
        return prev
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    const task = activeTask
    const column = activeColumn
    const origin = dragOrigin.current

    setActiveTask(null)
    setActiveColumn(null)
    dragOrigin.current = null

    if (!over) return

    if (column) {
      if (active.id === over.id) return
      const oldIndex = localStatuses.findIndex((s) => `column-${s.id}` === active.id)
      const newIndex = localStatuses.findIndex((s) => `column-${s.id}` === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localStatuses, oldIndex, newIndex)
        setLocalStatuses(reordered)
        reorderStatuses.mutate(reordered.map((s) => s.id))
      }
      return
    }

    if (task && origin) {
      const finalContainer = findContainer(`task-${task.id}`)
      if (finalContainer == null) return

      const finalItems = columnTasks[finalContainer] ?? []

      if (origin.statusId === finalContainer) {
        reorderTasks.mutate({ columnId: finalContainer, taskIds: finalItems.map((t) => t.id) })
      } else {
        moveTask.mutate({ taskId: task.id, statusId: finalContainer })
        reorderTasks.mutate({ columnId: finalContainer, taskIds: finalItems.map((t) => t.id) })
      }
    }
  }

  if (tasksLoading || statusesLoading) {
    return <Loader mt="xl" />
  }

  if (!statuses || statuses.length === 0) {
    return <Text c="dimmed" mt="xl">No statuses yet. Create one in Manage Statuses.</Text>
  }

  return (
    <ScrollArea style={{ height: 'calc(100vh - 270px)' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveTask(null)
          setActiveColumn(null)
          dragOrigin.current = null
        }}
      >
        <Group wrap="nowrap" align="stretch" gap="md">
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

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div style={{ transform: 'rotate(2deg)', cursor: 'grabbing' }}>
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ScrollArea>
  )
}
