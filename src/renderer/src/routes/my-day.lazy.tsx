import { ActionIcon, Box, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useActiveTimer, useMyDayTasks, useTasks } from '../api'
import { TaskCard } from '../components/TaskCard'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'

function MyDayPage() {
	const { data: myDayTasks } = useMyDayTasks()
	const { data: allTasks } = useTasks()
	const { data: activeTimer } = useActiveTimer()
	const setActive = useTimerStore((s) => s.setActive)
	const [expanded, setExpanded] = useState(false)

	useEffect(() => {
		if (activeTimer) {
			setActive(activeTimer.entry, activeTimer.task)
		} else {
			setActive(null, null)
		}
	}, [activeTimer, setActive])

	const today = new Date().toISOString().split('T')[0]
	const tasks = myDayTasks ?? []
	const overdue = tasks.filter((t) => t.my_day_date && t.my_day_date < today)
	const current = tasks.filter((t) => t.my_day_date === today)
	const otherTasks = (allTasks ?? []).filter((t) => !t.my_day_date)

	return (
		<Container
			fluid
			py='xl'
			style={{
				display: 'flex',
				flexDirection: 'column',
				height:
					'calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-footer-offset, 0rem) - 2 * var(--app-shell-padding))',
			}}
		>
			<Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
				<Title order={1} mb='lg'>
					My Day
				</Title>

				{overdue.length > 0 && (
					<>
						<Title order={2} size='h3' c='red' mb='sm'>
							Overdue
						</Title>
						<Stack mb='xl'>
							{overdue.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</Stack>
					</>
				)}

				{current.length > 0 ? (
					<>
						<Title order={2} size='h3' c='green' mb='sm'>
							Today
						</Title>
						<Stack mb='xl'>
							{current.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</Stack>
					</>
				) : (
					<Text c='dimmed'>Nothing added yet.</Text>
				)}
			</Box>

			<Box pt='md'>
				{otherTasks.length > 0 ? (
					<>
						<Group gap='xs' mb='sm' style={{ cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
							<Title order={2} size='h3'>
								Other Tasks
							</Title>
							<ActionIcon variant='subtle' color='gray' size='sm'>
								<IconChevronDown
									style={{
										transform: expanded ? 'rotate(180deg)' : 'none',
										transition: 'transform 0.2s',
									}}
								/>
							</ActionIcon>
						</Group>
						<Box style={{ position: 'relative' }}>
							<Box style={expanded ? { maxHeight: '60vh', overflowY: 'auto' } : { maxHeight: 40, overflow: 'hidden' }}>
								<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
									{(expanded ? otherTasks : otherTasks.slice(0, 3)).map((task) => (
										<TaskCard key={task.id} task={task} />
									))}
								</SimpleGrid>
							</Box>
							{!expanded && otherTasks.length > 0 && (
								<Box
									style={{
										position: 'absolute',
										bottom: 0,
										left: 0,
										right: 0,
										height: 48,
										pointerEvents: 'none',
										background: 'linear-gradient(to bottom, transparent, var(--mantine-color-body))',
									}}
								/>
							)}
						</Box>
					</>
				) : (
					<Text c='dimmed'>No other tasks.</Text>
				)}
			</Box>
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.MY_DAY)({
	component: MyDayPage,
})
