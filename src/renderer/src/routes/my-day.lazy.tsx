import { Container, Stack, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useActiveTimer, useMyDayTasks } from '../api'
import { TaskCard } from '../components/TaskCard'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'

function MyDayPage() {
	const { data: myDayTasks } = useMyDayTasks()
	const { data: activeTimer } = useActiveTimer()
	const setActive = useTimerStore((s) => s.setActive)

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

	return (
		<Container fluid py='xl'>
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
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.MY_DAY)({
	component: MyDayPage,
})
