import { Button, Container, Group, Tabs, Text, Title } from '@mantine/core'
import { IconColumns, IconLayoutBoard, IconList, IconPlus } from '@tabler/icons-react'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateItem } from '../api'
import { CanvasBoard } from '../components/CanvasBoard'
import { ItemFilters } from '../components/ItemFilters'
import { ItemGrid } from '../components/ItemGrid'
import { KanbanBoard } from '../components/KanbanBoard'
import { ManageGroupsModal } from '../components/ManageGroupsModal'
import { ManageStatusesModal } from '../components/ManageStatusesModal'
import { useItemFilters } from '../hooks/useItemFilters'
import { ROUTES } from '../routes'
import { setLastItemsTab } from '../store/lastItemsTab'

const Route = createLazyRoute(ROUTES.ITEMS)({
	component: ItemsPage,
})

function ItemsPage() {
	const navigate = Route.useNavigate()
	const { t } = useTranslation()
	const { tab, focusGroup, focusItem } = Route.useSearch()
	const { isLoading, filteredItems } = useItemFilters()
	const createItem = useCreateItem()

	useEffect(() => {
		setLastItemsTab(tab ?? 'list')
	}, [tab])

	return (
		<Container fluid py='xl'>
			<Group justify='space-between' mb='lg'>
				<Title order={1}>{t('items.title')}</Title>
				<Group gap='xs'>
					<ManageGroupsModal />
					<ManageStatusesModal />
					{tab === 'list' ? (
						<Button variant='light' leftSection={<IconPlus size={16} />} onClick={() => void createItem()}>
							{t('items.newItem')}
						</Button>
					) : null}
				</Group>
			</Group>

			{(tab === 'list' || tab === 'canvas') && <ItemFilters />}

			<Tabs value={tab} onChange={(v) => navigate({ search: (prev) => ({ ...prev, tab: v ?? 'list' }) })}>
				<Tabs.List mb='md'>
					<Tabs.Tab value='list' leftSection={<IconList size={14} />}>
						{t('items.list')}
					</Tabs.Tab>
					<Tabs.Tab value='kanban' leftSection={<IconColumns size={14} />}>
						{t('items.kanban')}
					</Tabs.Tab>
					<Tabs.Tab value='canvas' leftSection={<IconLayoutBoard size={14} />}>
						{t('items.canvas')}
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='list'>
					{isLoading ? (
						<Text c='dimmed'>{t('common.loading')}</Text>
					) : filteredItems.length === 0 ? (
						<Text c='dimmed'>{t('items.noItemsYet')}</Text>
					) : (
						<ItemGrid items={filteredItems} />
					)}
				</Tabs.Panel>

				<Tabs.Panel value='kanban'>
					<KanbanBoard />
				</Tabs.Panel>

				<Tabs.Panel value='canvas'>
					<CanvasBoard items={filteredItems} focusGroupId={focusGroup} focusItemId={focusItem} />
				</Tabs.Panel>
			</Tabs>
		</Container>
	)
}

export { Route }
