import { ActionIcon, Button, ColorInput, Group, Modal, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddCanvasGroup, useCanvasGroups, useDeleteCanvasGroup, useUpdateCanvasGroup } from '../api'
import type { CanvasGroup } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'

interface GroupItemProps {
	group: CanvasGroup
	onUpdate: (id: number, name: string, color: string) => void
	onDelete: (id: number) => void
}

function GroupItem({ group, onUpdate, onDelete }: GroupItemProps) {
	const { t } = useTranslation()
	const [editing, setEditing] = useState(false)
	const [name, setName] = useState(group.name)
	const [color, setColor] = useState(group.color)

	return (
		<Group gap='xs' wrap='nowrap'>
			<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
			{editing ? (
				<>
					<TextInput size='xs' value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
					<ColorInput size='xs' value={color} onChange={setColor} style={{ width: 100 }} />
					<Button
						size='xs'
						onClick={() => {
							onUpdate(group.id, name.trim() || group.name, color)
							setEditing(false)
						}}
					>
						{t('common.save')}
					</Button>
				</>
			) : (
				<>
					<Text style={{ flex: 1 }} size='sm'>
						{group.name}
					</Text>
					<Tooltip label={t('common.edit')}>
						<Button size='compact-xs' variant='subtle' onClick={() => setEditing(true)}>
							{t('common.edit')}
						</Button>
					</Tooltip>
				</>
			)}
			<Tooltip label={t('common.delete')}>
				<ActionIcon size='sm' color='red' variant='subtle' onClick={() => onDelete(group.id)}>
					<IconTrash size={14} />
				</ActionIcon>
			</Tooltip>
		</Group>
	)
}

export function ManageGroupsModal() {
	const { t } = useTranslation()
	const [opened, { open, close }] = useDisclosure(false)
	const { data: groups, isLoading } = useCanvasGroups()
	const addGroup = useAddCanvasGroup()
	const updateGroup = useUpdateCanvasGroup()
	const deleteGroup = useDeleteCanvasGroup()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('groups.deleteTitle'),
		message: t('groups.deleteBody'),
	})

	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState('#868e96')

	const handleAdd = () => {
		if (!newName.trim()) return
		addGroup.mutate({ name: newName.trim(), color: newColor })
		setNewName('')
		setNewColor('#868e96')
	}

	return (
		<>
			<Button onClick={open} variant='outline'>
				{t('groups.manage')}
			</Button>

			<Modal opened={opened} onClose={close} title={t('groups.manage')} size='md'>
				<Stack>
					<Group gap='xs'>
						<TextInput
							placeholder={t('groups.namePlaceholder')}
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
					) : !groups || groups.length === 0 ? (
						<Text c='dimmed' size='sm'>
							{t('groups.none')}
						</Text>
					) : (
						<Stack gap='xs'>
							{groups.map((group) => (
								<GroupItem
									key={group.id}
									group={group}
									onUpdate={(id, name, color) => updateGroup.mutate({ id, name, color })}
									onDelete={(id) => confirmDelete(() => deleteGroup.mutate(id))}
								/>
							))}
						</Stack>
					)}
				</Stack>
			</Modal>
			{confirmDeleteModal}
		</>
	)
}
