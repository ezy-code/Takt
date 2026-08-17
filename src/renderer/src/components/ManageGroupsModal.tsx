import {
	ActionIcon,
	Button,
	ColorPicker,
	ColorSwatch,
	Group,
	Modal,
	Popover,
	Select,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconTrash } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddGroup, useDeleteGroup, useGroups, useUpdateGroup } from '../api'
import type { Group as GroupModel } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'

function descendantsOf(groups: GroupModel[], groupId: number): Set<number> {
	const result = new Set<number>()
	const walk = (id: number) => {
		for (const g of groups) {
			if (g.parentId === id && !result.has(g.id)) {
				result.add(g.id)
				walk(g.id)
			}
		}
	}
	walk(groupId)
	return result
}

function flattened(groups: GroupModel[]): { group: GroupModel; depth: number }[] {
	const byParent = new Map<number | null, GroupModel[]>()
	for (const g of groups) byParent.set(g.parentId ?? null, [...(byParent.get(g.parentId ?? null) ?? []), g])
	const out: { group: GroupModel; depth: number }[] = []
	const walk = (parentId: number | null, depth: number) => {
		for (const g of byParent.get(parentId) ?? []) {
			out.push({ group: g, depth })
			walk(g.id, depth + 1)
		}
	}
	walk(null, 0)
	return out
}

function ColorPickerButton({ value, onChange }: { value: string; onChange: (color: string) => void }) {
	const [opened, setOpened] = useState(false)
	return (
		<Popover opened={opened} onChange={setOpened}>
			<Popover.Target>
				<ColorSwatch
					component='button'
					color={value}
					size={12}
					radius='xl'
					aria-label='Pick color'
					onClick={() => setOpened((o) => !o)}
					style={{ cursor: 'pointer', border: 'none', padding: 0 }}
				/>
			</Popover.Target>
			<Popover.Dropdown p={6}>
				<ColorPicker value={value} onChange={onChange} />
			</Popover.Dropdown>
		</Popover>
	)
}

interface GroupItemProps {
	group: GroupModel
	depth: number
	excludedIds: Set<number>
	allOptions: { value: string; label: string }[]
	onUpdate: (id: number, patch: { name?: string; color?: string; parentId?: number | null }) => void
	onDelete: (id: number) => void
}

function GroupItem({ group, depth, excludedIds, allOptions, onUpdate, onDelete }: GroupItemProps) {
	const { t } = useTranslation()
	const [editing, setEditing] = useState(false)
	const [name, setName] = useState(group.name)
	const [color, setColor] = useState(group.color)

	const parentOptions = allOptions.filter((option) => !excludedIds.has(Number(option.value)))

	return (
		<Group gap='xs' wrap='nowrap' style={{ paddingLeft: depth * 2 }}>
			{depth > 0 && (
				<Text c='dimmed' size='xs' style={{ width: 12, textAlign: 'center' }}>
					-
				</Text>
			)}
			{!editing && (
				<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
			)}
			{editing ? (
				<>
					<ColorPickerButton value={color} onChange={setColor} />
					<TextInput size='xs' value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
					<Select
						size='xs'
						placeholder={t('groups.noParent')}
						clearable
						data={parentOptions}
						value={group.parentId != null ? String(group.parentId) : null}
						onChange={(value) => onUpdate(group.id, { parentId: value ? Number(value) : null })}
						w={110}
						searchable
					/>
					<Button
						size='xs'
						onClick={() => {
							onUpdate(group.id, { name: name.trim() || group.name, color })
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
	const { data: groups, isLoading } = useGroups()
	const addGroup = useAddGroup()
	const updateGroup = useUpdateGroup()
	const deleteGroup = useDeleteGroup()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('groups.deleteTitle'),
		message: t('groups.deleteBody'),
	})

	const [newName, setNewName] = useState('')
	const [newColor, setNewColor] = useState('#868e96')
	const [newParentId, setNewParentId] = useState<string | null>(null)

	const items = useMemo(() => flattened(groups ?? []), [groups])
	const allOptions = (groups ?? []).map((g) => ({ value: String(g.id), label: g.name }))
	const excludedByGroup = useMemo(() => {
		const map = new Map<number, Set<number>>()
		for (const g of groups ?? []) map.set(g.id, new Set([g.id, ...descendantsOf(groups ?? [], g.id)]))
		return map
	}, [groups])

	const handleAdd = () => {
		if (!newName.trim()) return
		addGroup.mutate({ name: newName.trim(), color: newColor, parentId: newParentId ? Number(newParentId) : null })
		setNewName('')
		setNewColor('#868e96')
		setNewParentId(null)
	}

	return (
		<>
			<Button onClick={open} variant='outline'>
				{t('groups.manage')}
			</Button>

			<Modal opened={opened} onClose={close} title={t('groups.manage')} size='md'>
				<Stack>
					<Group gap='xs'>
						<ColorPickerButton value={newColor} onChange={setNewColor} />
						<TextInput
							placeholder={t('groups.namePlaceholder')}
							value={newName}
							onChange={(e) => setNewName(e.currentTarget.value)}
							style={{ flex: 1 }}
							size='sm'
						/>
						<Select
							size='sm'
							placeholder={t('groups.noParent')}
							clearable
							data={allOptions}
							value={newParentId}
							onChange={setNewParentId}
							w={110}
							searchable
						/>
						<Button size='sm' onClick={handleAdd}>
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
							{items.map(({ group, depth }) => (
								<GroupItem
									key={group.id}
									group={group}
									depth={depth}
									excludedIds={excludedByGroup.get(group.id) ?? new Set()}
									allOptions={allOptions}
									onUpdate={(id, patch) => updateGroup.mutate({ id, ...patch })}
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
