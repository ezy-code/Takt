import { Badge, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { IconLink, IconPlus } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddTaskLink, useDeleteTaskLink, useTaskRelatedItems, useTasks } from '../api'
import { ROUTES } from '../routes'
import type { EntityType, Task } from '../types'
import { EntityRow } from './EntityRow'

interface RelatedEntitiesProps {
	entity: Task
}

const ENTITY_TYPES: EntityType[] = ['task', 'note', 'project']

function isAncestor(entities: Task[], ancestorId: number, entityId: number) {
	const byId = new Map(entities.map((item) => [item.id, item]))
	let parentId = byId.get(entityId)?.parentId
	const visited = new Set<number>()
	while (parentId != null && !visited.has(parentId)) {
		visited.add(parentId)
		if (parentId === ancestorId) return true
		parentId = byId.get(parentId)?.parentId
	}
	return false
}

export function RelatedEntities({ entity }: RelatedEntitiesProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const [opened, setOpened] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const { data: related = [] } = useTaskRelatedItems(entity.id)
	const { data: entities = [] } = useTasks()
	const addLink = useAddTaskLink()
	const deleteLink = useDeleteTaskLink()
	const linkedIds = new Set(related.map((item) => item.id))

	const options = ENTITY_TYPES.map((type) => ({
		group: t(`entity.${type}`),
		items: entities
			.filter(
				(item) =>
					item.id !== entity.id &&
					item.entityType === type &&
					!linkedIds.has(item.id) &&
					!isAncestor(entities, entity.id, item.id) &&
					!isAncestor(entities, item.id, entity.id),
			)
			.map((item) => ({ value: String(item.id), label: item.name })),
	})).filter((group) => group.items.length > 0)

	const grouped = ENTITY_TYPES.map((type) => ({
		type,
		items: related.filter((item) => (item.entityType ?? 'task') === type),
	})).filter((group) => group.items.length > 0)

	const openEntity = (id: number) => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
	const add = () => {
		if (!selectedId) return
		addLink.mutate(
			{ sourceTaskId: entity.id, targetTaskId: Number(selectedId) },
			{
				onSuccess: () => {
					setSelectedId(null)
					setOpened(false)
				},
			},
		)
	}

	return (
		<Stack gap='sm' style={{ width: '100%' }}>
			<Group justify='space-between' align='center'>
				<Group gap='xs'>
					<IconLink size={16} />
					<Text size='sm' fw={500}>
						{t('entities.related')}
					</Text>
					<Badge size='xs' variant='light' circle>
						{related.length}
					</Badge>
				</Group>
				<Button size='xs' variant='light' leftSection={<IconPlus size={14} />} onClick={() => setOpened(true)}>
					{t('entities.addRelation')}
				</Button>
			</Group>

			{grouped.length === 0 ? (
				<Text size='sm' c='dimmed'>
					{t('entities.relatedEmpty')}
				</Text>
			) : (
				grouped.map((group) => (
					<Stack key={group.type} gap={2}>
						<Text size='xs' fw={600} c='dimmed'>
							{t(`entity.${group.type}`)} ({group.items.length})
						</Text>
						{group.items.map((item) => (
							<EntityRow
								key={item.linkId}
								entity={item}
								onOpen={() => openEntity(item.id)}
								onRemove={() => deleteLink.mutate(item.linkId)}
								removeLabel={t('entities.removeRelation')}
							/>
						))}
					</Stack>
				))
			)}

			<Modal opened={opened} onClose={() => setOpened(false)} title={t('entities.addRelation')} centered>
				<Stack>
					<Select
						searchable
						clearable
						data={options}
						value={selectedId}
						onChange={setSelectedId}
						placeholder={t('entities.searchPlaceholder')}
						nothingFoundMessage={t('entities.nothingFound')}
					/>
					{addLink.error && (
						<Text c='red' size='sm'>
							{addLink.error.message}
						</Text>
					)}
					<Group justify='flex-end'>
						<Button variant='default' onClick={() => setOpened(false)}>
							{t('common.cancel')}
						</Button>
						<Button onClick={add} disabled={!selectedId || addLink.isPending}>
							{t('entities.addRelation')}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	)
}
