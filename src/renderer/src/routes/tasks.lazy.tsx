import { Button, Container, Group, Select, Tabs, Text, Title } from '@mantine/core'
import { IconColumns, IconLayoutBoard, IconList, IconPlus } from '@tabler/icons-react'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCanvasGroups, useProjects, useTasks } from '../api'
import { CanvasBoard } from '../components/CanvasBoard'
import { KanbanBoard } from '../components/KanbanBoard'
import { ManageGroupsModal } from '../components/ManageGroupsModal'
import { ManageStatusesModal } from '../components/ManageStatusesModal'
import { TaskGrid } from '../components/TaskGrid'
import { ROUTES } from '../routes'
import { setLastTasksTab } from '../store/lastTasksTab'

const Route = createLazyRoute(ROUTES.TASKS)({
	component: TasksPage,
})

function TasksPage() {
	const navigate = Route.useNavigate()
	const { t } = useTranslation()
	const { tab, focusGroup, focusTask } = Route.useSearch()
	const { data: tasks, isLoading } = useTasks()
	const { data: projects } = useProjects()
	const { data: groups } = useCanvasGroups()
	const [projectFilter, setProjectFilter] = useState<string | null>(null)
	const [groupFilter, setGroupFilter] = useState<string | null>(null)

	const filteredTasks = (tasks ?? []).filter(
		(t) =>
			(projectFilter == null || t.projectId === Number(projectFilter)) &&
			(groupFilter == null || t.groupId === Number(groupFilter)),
	)

	const projectOptions = (projects ?? []).map((p) => ({
		value: String(p.id),
		label: p.name,
	}))

	const groupOptions = (groups ?? []).map((g) => ({
		value: String(g.id),
		label: g.name,
	}))

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

			{(tab === 'list' || tab === 'canvas') && (
				<Group mb='md'>
					<Select
						label={t('tasks.filterByProject')}
						placeholder={t('tasks.allProjects')}
						clearable
						data={projectOptions}
						value={projectFilter}
						onChange={setProjectFilter}
						w={280}
					/>
					<Select
						label={t('tasks.filterByGroup')}
						placeholder={t('tasks.allGroups')}
						clearable
						data={groupOptions}
						value={groupFilter}
						onChange={setGroupFilter}
						w={280}
					/>
					{(projectFilter != null || groupFilter != null) && (
						<Button
							variant='default'
							mt={22}
							onClick={() => {
								setProjectFilter(null)
								setGroupFilter(null)
							}}
						>
							{t('common.reset')}
						</Button>
					)}
				</Group>
			)}

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
						<Text c='dimmed'>{projectFilter ? t('tasks.noTasksInProject') : t('tasks.noTasksYet')}</Text>
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
