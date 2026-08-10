import type { DragEndEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ActionIcon, Button, ColorInput, Group, Modal, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconGripVertical, IconPlus, IconStar, IconStarFilled, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	useAddStatus,
	useDeleteStatus,
	useReorderStatuses,
	useSetDefaultStatus,
	useStatuses,
	useUpdateStatus,
} from '../api'
import type { Status } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'

interface SortableStatusItemProps {
	status: Status
	onUpdate: (id: number, name: string, color: string) => void
	onDelete: (id: number) => void
	onSetDefault: (id: number) => void
}

function SortableStatusItem({ status, onUpdate, onDelete, onSetDefault }: SortableStatusItemProps) {
	const { t } = useTranslation()
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
		<Group ref={setNodeRef} style={style} gap='xs' {...attributes}>
			<div {...listeners} style={{ cursor: 'grab', display: 'flex' }}>
				<IconGripVertical size={16} />
			</div>
			<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
			<Tooltip label={status.is_default ? t('statuses.defaultForNew') : t('statuses.setDefaultForNew')}>
				<ActionIcon
					size='sm'
					variant={status.is_default ? 'filled' : 'subtle'}
					color={status.is_default ? 'yellow' : 'gray'}
					onClick={() => !status.is_default && onSetDefault(status.id)}
				>
					{status.is_default ? <IconStarFilled size={14} /> : <IconStar size={14} />}
				</ActionIcon>
			</Tooltip>
			{editing ? (
				<>
					<TextInput size='xs' value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
					<ColorInput size='xs' value={color} onChange={setColor} style={{ width: 80 }} />
					<Button
						size='xs'
						onClick={() => {
							onUpdate(status.id, name, color)
							setEditing(false)
						}}
					>
						{t('common.save')}
					</Button>
				</>
			) : (
				<>
					<Text style={{ flex: 1 }} size='sm'>
						{status.name}
					</Text>
					<Tooltip label={t('common.edit')}>
						<Button size='compact-xs' variant='subtle' onClick={() => setEditing(true)}>
							{t('common.edit')}
						</Button>
					</Tooltip>
				</>
			)}
			<Tooltip label={t('common.delete')}>
				<ActionIcon size='sm' color='red' variant='subtle' onClick={() => onDelete(status.id)}>
					<IconTrash size={14} />
				</ActionIcon>
			</Tooltip>
		</Group>
	)
}

export function ManageStatusesModal() {
	const { t } = useTranslation()
	const [opened, { open, close }] = useDisclosure(false)
	const { data: statuses, isLoading } = useStatuses()
	const addStatus = useAddStatus()
	const updateStatus = useUpdateStatus()
	const deleteStatus = useDeleteStatus()
	const reorderStatuses = useReorderStatuses()
	const setDefaultStatus = useSetDefaultStatus()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete()

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
			<Button onClick={open} variant='light'>
				{t('statuses.manage')}
			</Button>

			<Modal opened={opened} onClose={close} title={t('statuses.manage')} size='md'>
				<Stack>
					<Text size='sm' c='dimmed'>
						{t('statuses.hint')}
					</Text>
					<Group gap='xs'>
						<TextInput
							placeholder={t('statuses.namePlaceholder')}
							value={newName}
							onChange={(e) => setNewName(e.currentTarget.value)}
							style={{ flex: 1 }}
							size='sm'
						/>
						<ColorInput size='sm' value={newColor} onChange={setNewColor} style={{ width: 100 }} />
						<Button size='sm' onClick={handleAdd} leftSection={<IconPlus size={14} />}>
							{t('common.add')}
						</Button>
					</Group>

					{isLoading ? (
						<Text c='dimmed' size='sm'>
							{t('common.loading')}
						</Text>
					) : !statuses || statuses.length === 0 ? (
						<Text c='dimmed' size='sm'>
							{t('statuses.none')}
						</Text>
					) : (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
							<SortableContext items={statuses.map((s) => `status-${s.id}`)} strategy={verticalListSortingStrategy}>
								<Stack gap='xs'>
									{statuses.map((status) => (
										<SortableStatusItem
											key={status.id}
											status={status}
											onUpdate={(id, name, color) => updateStatus.mutate({ id, name, color })}
											onDelete={(id) => confirmDelete(() => deleteStatus.mutate(id))}
											onSetDefault={(id) => setDefaultStatus.mutate(id)}
										/>
									))}
								</Stack>
							</SortableContext>
						</DndContext>
					)}
				</Stack>
			</Modal>
			{confirmDeleteModal}
		</>
	)
}
