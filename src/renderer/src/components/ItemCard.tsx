import { ActionIcon, Anchor, Badge, Card, Group, Menu, Spoiler, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconClock, IconDots, IconEye, IconLayoutBoard, IconPencil, IconSitemap, IconTrash } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDeleteItem, useGroups, useItems, useStatuses } from '../api'
import { ROUTES } from '../routes'
import type { Item } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'
import { EntityRow } from './EntityRow'
import { EntityTypeBadge } from './EntityTypeBadge'
import { ItemCostPill } from './ItemCostPill'
import { MarkdownPreview } from './MarkdownPreview'
import { MyDayControl } from './MyDayControl'
import { TimerControl } from './TimerControl'

interface ItemCardProps {
	item: Item
}

export function ItemCard({ item }: ItemCardProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const deleteItem = useDeleteItem()
	const { data: statuses } = useStatuses()
	const { data: groups } = useGroups()
	const { data: items } = useItems()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('items.deleteTitle'),
		message: t('items.deleteBody'),
	})

	const status = statuses?.find((s) => s.id === item.statusId)
	const parent = item.parentName
	const group = groups?.find((g) => g.id === item.groupId)
	const isPast = item.reminder_at != null && new Date(item.reminder_at).getTime() < Date.now()
	const children = items?.filter((t) => t.parentId === item.id) ?? []

	const menuItems = (
		<>
			<MyDayControl itemId={item.id} myDayDate={item.my_day_date} variant='menu-item' />
			<Menu.Divider />
			<Menu.Item
				leftSection={<IconEye size={14} />}
				onClick={() => navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(item.id) } })}
			>
				{t('common.view')}
			</Menu.Item>
			<Menu.Item
				leftSection={<IconPencil size={14} />}
				onClick={() => navigate({ to: ROUTES.ITEM_EDIT, params: { id: String(item.id) } })}
			>
				{t('common.edit')}
			</Menu.Item>
			<Menu.Item
				leftSection={<IconLayoutBoard size={14} />}
				onClick={() => navigate({ to: ROUTES.ITEMS, search: { tab: 'canvas', focusItem: item.id } })}
			>
				{t('items.openOnCanvas')}
			</Menu.Item>
			<Menu.Divider />
			<Menu.Item
				color='red'
				leftSection={<IconTrash size={14} />}
				onClick={() => confirmDelete(() => deleteItem.mutate(item.id))}
			>
				{t('common.delete')}
			</Menu.Item>
		</>
	)

	return (
		<>
			<Card withBorder padding='sm' radius='md' h='100%'>
				<Menu>
					<Menu.ContextMenu>
						<Stack gap={8} h='100%' justify='space-between'>
							<Group justify='space-between' align='flex-start' gap='xs' wrap='nowrap'>
								<div style={{ flex: 1, minWidth: 0 }}>
									<Group gap='xs' align='center' wrap='wrap'>
										<Anchor
											component='button'
											fw={500}
											style={{ textAlign: 'left' }}
											onClick={() => navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(item.id) } })}
										>
											{item.name}
										</Anchor>
										<EntityTypeBadge entityType={item.entityType} />
									</Group>
								</div>
								<Group gap='xs' wrap='nowrap' align='center'>
									<TimerControl itemId={item.id} duration={item.total_duration} />
									<Menu shadow='md' width={200} position='bottom-end'>
										<Menu.Target>
											<ActionIcon variant='subtle' color='gray' size='sm' aria-label={t('items.actions')}>
												<IconDots size={16} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>{menuItems}</Menu.Dropdown>
									</Menu>
								</Group>
							</Group>

							{/* {item.description_md && (
							<Spoiler maxHeight={80} showLabel='Show more' hideLabel='Hide'>
								<MarkdownPreview content={item.description_md} variant='preview' />
							</Spoiler>
						)} */}

							<Group gap='md' align='center'>
								<ItemCostPill item={item} />
								<MyDayControl itemId={item.id} myDayDate={item.my_day_date} />
								{item.entityType === 'task' && status && (
									<Group
										gap={5}
										align='center'
										px={6}
										py={2}
										style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}
									>
										<div
											style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }}
										/>
										<Text size='xs'>{status.name}</Text>
									</Group>
								)}
								{group && (
									<Badge
										component='button'
										size='xs'
										variant='light'
										style={{
											background: `${group.color}1a`,
											color: group.color,
											border: `1px solid ${group.color}66`,
											cursor: 'pointer',
										}}
										onClick={() => navigate({ to: ROUTES.ITEMS, search: { tab: 'canvas', focusGroup: group.id } })}
									>
										{group.name}
									</Badge>
								)}
								{parent && (
									<Group
										component={UnstyledButton}
										gap={5}
										align='center'
										px={6}
										py={2}
										style={{
											borderRadius: 999,
											background: 'var(--mantine-color-default-light)',
											cursor: 'pointer',
										}}
										onClick={() => {
											if (item.parentId != null)
												navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(item.parentId) } })
										}}
									>
										<IconSitemap size={12} color='var(--mantine-color-dimmed)' />
										<Text size='xs' c='dimmed'>
											{parent}
										</Text>
										{item.parentType && <EntityTypeBadge entityType={item.parentType} />}
									</Group>
								)}
								{item.reminder_at && (
									<Group
										gap={5}
										align='center'
										px={6}
										py={2}
										style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}
									>
										<IconClock
											size={12}
											color={isPast ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-dimmed)'}
										/>
										<Text size='xs' c={isPast ? 'red' : 'dimmed'}>
											{new Date(item.reminder_at).toLocaleString(undefined, {
												dateStyle: 'short',
												timeStyle: 'short',
											})}
										</Text>
									</Group>
								)}
								<Text size='xs' c='dimmed'>
									{new Date(item.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
								</Text>
							</Group>
							{children.length > 0 && (
								<Stack gap={2}>
									<Group gap='xs'>
										<Text size='xs' fw={600} c='dimmed'>
											{t('entities.children')}
										</Text>
										<Badge size='xs' variant='light' circle>
											{children.length}
										</Badge>
									</Group>
									{children.map((child) => (
										<EntityRow
											key={child.id}
											entity={child}
											onOpen={() => navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(child.id) } })}
										/>
									))}
								</Stack>
							)}
						</Stack>
					</Menu.ContextMenu>
					<Menu.Dropdown>{menuItems}</Menu.Dropdown>
				</Menu>
			</Card>
			{confirmDeleteModal}
		</>
	)
}
