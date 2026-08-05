import { Button, Container, Group, Select, Stack, Tabs, Text, Title } from '@mantine/core'
import { IconColumns, IconList, IconPlus } from '@tabler/icons-react'
import { createLazyRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useActiveTimer, useProjects, useTasks } from '../api'
import { KanbanBoard } from '../components/KanbanBoard'
import { ManageStatusesModal } from '../components/ManageStatusesModal'
import { TaskCard } from '../components/TaskCard'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'

const Route = createLazyRoute(ROUTES.TASKS)({
	component: TasksPage,
})

function TasksPage() {
	const navigate = useNavigate()
	const { tab } = Route.useSearch()
	const { data: tasks, isLoading } = useTasks()
	const { data: projects } = useProjects()
	const { data: activeTimer } = useActiveTimer()
	const setActive = useTimerStore((s) => s.setActive)
	const [projectFilter, setProjectFilter] = useState<string | null>(null)

	const filteredTasks = (tasks ?? []).filter((t) =>
		projectFilter == null ? t.projectId == null : t.projectId === Number(projectFilter),
	)

	const projectOptions = (projects ?? []).map((p) => ({
		value: String(p.id),
		label: p.name,
	}))

	useEffect(() => {
		if (activeTimer) {
			setActive(activeTimer.entry, activeTimer.task)
		} else {
			setActive(null, null)
		}
	}, [activeTimer, setActive])

	return (
		<Container fluid py='xl'>
			<Group justify='space-between' mb='lg'>
				<Title order={1}>Tasks</Title>
				{tab === 'list' ? (
					<Button leftSection={<IconPlus size={16} />} onClick={() => navigate({ to: ROUTES.TASKS_NEW })}>
						New Task
					</Button>
				) : (
					<ManageStatusesModal />
				)}
			</Group>

			{tab === 'list' && (
				<Group mb='md'>
					<Select
						label='Filter by project'
						placeholder='All projects'
						clearable
						data={projectOptions}
						value={projectFilter}
						onChange={setProjectFilter}
						w={280}
					/>
					{projectFilter != null && (
						<Button variant='default' mt={22} onClick={() => setProjectFilter(null)}>
							Reset
						</Button>
					)}
				</Group>
			)}

			<Tabs value={tab} onChange={(v) => navigate({ search: { tab: v } })}>
				<Tabs.List mb='md'>
					<Tabs.Tab value='list' leftSection={<IconList size={14} />}>
						List
					</Tabs.Tab>
					<Tabs.Tab value='kanban' leftSection={<IconColumns size={14} />}>
						Kanban
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='list'>
					{isLoading ? (
						<Text c='dimmed'>Loading...</Text>
					) : filteredTasks.length === 0 ? (
						<Text c='dimmed'>{projectFilter ? 'No tasks in this project.' : 'No tasks yet. Create one.'}</Text>
					) : (
						<Stack>
							{filteredTasks.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</Stack>
					)}
				</Tabs.Panel>

				<Tabs.Panel value='kanban'>
					<KanbanBoard />
				</Tabs.Panel>
			</Tabs>
		</Container>
	)
}

export { Route }
