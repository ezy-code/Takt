import { useState } from 'react'
import { Modal, Group, TextInput, ColorInput, Button, Stack, Text, ActionIcon, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStatuses, useAddStatus, useUpdateStatus, useDeleteStatus, useReorderStatuses } from '../api'
import type { Status } from '../types'
import type { DragEndEvent } from '@dnd-kit/core'

interface SortableStatusItemProps {
  status: Status
  onUpdate: (id: number, name: string, color: string) => void
  onDelete: (id: number) => void
}

function SortableStatusItem({ status, onUpdate, onDelete }: SortableStatusItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `status-${status.id}`,
  })

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(status.name)
  const [color, setColor] = useState(status.color)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <Group ref={setNodeRef} style={style} gap="xs" {...attributes}>
      <div {...listeners} style={{ cursor: 'grab', display: 'flex' }}>
        <IconGripVertical size={16} />
      </div>
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
      {editing ? (
        <>
          <TextInput size="xs" value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
          <ColorInput size="xs" value={color} onChange={setColor} style={{ width: 80 }} />
          <Button size="xs" onClick={() => { onUpdate(status.id, name, color); setEditing(false) }}>Save</Button>
        </>
      ) : (
        <>
          <Text style={{ flex: 1 }} size="sm">{status.name}</Text>
          <Tooltip label="Edit">
            <Button size="xs" variant="subtle" onClick={() => setEditing(true)} compact>Edit</Button>
          </Tooltip>
        </>
      )}
      <Tooltip label="Delete">
        <ActionIcon size="sm" color="red" variant="subtle" onClick={() => onDelete(status.id)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

export function ManageStatusesModal() {
  const [opened, { open, close }] = useDisclosure(false)
  const { data: statuses, isLoading } = useStatuses()
  const addStatus = useAddStatus()
  const updateStatus = useUpdateStatus()
  const deleteStatus = useDeleteStatus()
  const reorderStatuses = useReorderStatuses()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#868e96')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !statuses) return

    const oldIndex = statuses.findIndex((s) => `status-${s.id}` === active.id)
    const newIndex = statuses.findIndex((s) => `status-${s.id}` === over.id)
    const reordered = arrayMove(statuses, oldIndex, newIndex)
    reorderStatuses.mutate(reordered.map((s) => s.id))
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    addStatus.mutate({ name: newName.trim(), color: newColor })
    setNewName('')
    setNewColor('#868e96')
  }

  return (
    <>
      <Button onClick={open} variant="light">
        Manage Statuses
      </Button>

      <Modal opened={opened} onClose={close} title="Manage Statuses" size="md">
        <Stack>
          <Group gap="xs">
            <TextInput
              placeholder="Status name"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              style={{ flex: 1 }}
              size="sm"
            />
            <ColorInput size="sm" value={newColor} onChange={setNewColor} style={{ width: 100 }} />
            <Button size="sm" onClick={handleAdd} leftSection={<IconPlus size={14} />}>
              Add
            </Button>
          </Group>

          {isLoading ? (
            <Text c="dimmed" size="sm">Loading...</Text>
          ) : !statuses || statuses.length === 0 ? (
            <Text c="dimmed" size="sm">No statuses yet.</Text>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={statuses.map((s) => `status-${s.id}`)} strategy={verticalListSortingStrategy}>
                <Stack gap="xs">
                  {statuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onUpdate={(id, name, color) => updateStatus.mutate({ id, name, color })}
                      onDelete={(id) => deleteStatus.mutate(id)}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          )}
        </Stack>
      </Modal>
    </>
  )
}
