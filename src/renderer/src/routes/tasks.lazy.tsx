import { Button, Container, Group, Tabs, Text, Title } from '@mantine/core'
import { IconColumns, IconLayoutBoard, IconList, IconPlus } from '@tabler/icons-react'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CanvasBoard } from '../components/CanvasBoard'
import { KanbanBoard } from '../components/KanbanBoard'
import { ManageGroupsModal } from '../components/ManageGroupsModal'
import { ManageStatusesModal } from '../components/ManageStatusesModal'
import { TaskFilters } from '../components/TaskFilters'
import { TaskGrid } from '../components/TaskGrid'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { ROUTES } from '../routes'
import { setLastTasksTab } from '../store/lastTasksTab'

const Route = createLazyRoute(ROUTES.TASKS)({
	component: TasksPage,
})

function TasksPage() {
	const navigate = Route.useNavigate()
	const { t } = useTranslation()
	const { tab, focusGroup, focusTask } = Route.useSearch()
	const { isLoading, filteredTasks } = useTaskFilters()

	useEffect(() => {
		setLastTasksTab(tab ?? 'list')
	}, [tab])

	return (
		<Container fluid py='xl'>
			<Group justify='space-between' mb='lg'>
				<Title order={1}>{t('tasks.title')}</Title>
				<Group gap='xs'>
					<ManageGroupsModal />
					<ManageStatusesModal />
					{tab === 'list' ? (
						<Button
							variant='light'
							leftSection={<IconPlus size={16} />}
							onClick={() => navigate({ to: ROUTES.TASKS_NEW })}
						>
							{t('tasks.newTask')}
						</Button>
					) : null}
				</Group>
			</Group>

			{(tab === 'list' || tab === 'canvas') && <TaskFilters />}

			<Tabs value={tab} onChange={(v) => navigate({ search: (prev) => ({ ...prev, tab: v ?? 'list' }) })}>
				<Tabs.List mb='md'>
					<Tabs.Tab value='list' leftSection={<IconList size={14} />}>
						{t('tasks.list')}
					</Tabs.Tab>
					<Tabs.Tab value='kanban' leftSection={<IconColumns size={14} />}>
						{t('tasks.kanban')}
					</Tabs.Tab>
					<Tabs.Tab value='canvas' leftSection={<IconLayoutBoard size={14} />}>
						{t('tasks.canvas')}
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='list'>
					{isLoading ? (
						<Text c='dimmed'>{t('common.loading')}</Text>
					) : filteredTasks.length === 0 ? (
						<Text c='dimmed'>{t('tasks.noTasksYet')}</Text>
					) : (
						<TaskGrid tasks={filteredTasks} />
					)}
				</Tabs.Panel>

				<Tabs.Panel value='kanban'>
					<KanbanBoard />
				</Tabs.Panel>

				<Tabs.Panel value='canvas'>
					<CanvasBoard tasks={filteredTasks} focusGroupId={focusGroup} focusTaskId={focusTask} />
				</Tabs.Panel>
			</Tabs>
		</Container>
	)
}

export { Route }
