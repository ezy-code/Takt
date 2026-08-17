import { Badge, Breadcrumbs, Button, Group, Select, Stack, Text } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEntityAncestors, useEntityChildren } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'
import { EntityRow } from './EntityRow'

interface EntityHierarchyProps {
	entity: Task
	onAddChild: () => void
	parentOptions: { value: string; label: string }[]
	parentId: string | null
	onParentChange: (value: string | null) => void
	parentDisabled?: boolean
}

export function EntityHierarchy({
	entity,
	onAddChild,
	parentOptions,
	parentId,
	onParentChange,
	parentDisabled,
}: EntityHierarchyProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { data: ancestors = [] } = useEntityAncestors(entity.id)
	const { data: children = [] } = useEntityChildren(entity.id)

	const open = (id: number) => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
	const groups = (['task', 'note', 'project'] as const)
		.map((type) => ({ type, items: children.filter((child) => (child.entityType ?? 'task') === type) }))
		.filter((group) => group.items.length > 0)

	return (
		<Stack gap='md' style={{ width: '100%' }}>
			<Stack gap={4}>
				<Text size='sm' fw={500}>
					{t('entities.parent')}
				</Text>
				<Select
					variant='unstyled'
					placeholder={t('entities.parentSearchPlaceholder')}
					clearable
					searchable
					data={parentOptions}
					value={parentId}
					onChange={onParentChange}
					disabled={parentDisabled}
				/>
			</Stack>
			<Stack gap={4}>
				<Group justify='space-between' gap='xs'>
					<Group gap='xs'>
						<Text size='sm' fw={500}>
							{t('entities.children')}
						</Text>
						<Badge size='xs' variant='light' circle>
							{children.length}
						</Badge>
					</Group>
					<Button size='xs' variant='light' leftSection={<IconPlus size={14} />} onClick={onAddChild}>
						{t('entities.addChild')}
					</Button>
				</Group>
				{groups.length === 0 ? (
					<Text size='sm' c='dimmed'>
						{t('entities.childrenEmpty')}
					</Text>
				) : (
					groups.map((group) => (
						<Stack key={group.type} gap={2}>
							<Text size='xs' fw={600} c='dimmed'>
								{t(`entity.${group.type}`)} ({group.items.length})
							</Text>
							{group.items.map((child) => (
								<EntityRow key={child.id} entity={child} onOpen={() => open(child.id)} />
							))}
						</Stack>
					))
				)}
			</Stack>
		</Stack>
	)
}
