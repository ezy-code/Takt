import { Box, Container, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveTimer, useMyDayTasks, useTasks } from '../api'
import { OtherTasksSection } from '../components/OtherTasksSection'
import { TaskGrid } from '../components/TaskGrid'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'

function MyDayPage() {
	const { t } = useTranslation()
	const { data: myDayTasks } = useMyDayTasks()
	const { data: allTasks } = useTasks()
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
					{t('myDay.title')}
				</Title>

				{overdue.length > 0 && (
					<>
						<Title order={2} size='h3' c='red' mb='sm'>
							{t('myDay.overdue')}
						</Title>
						<Box mb='xl'>
							<TaskGrid tasks={overdue} />
						</Box>
					</>
				)}

				{current.length > 0 ? (
					<>
						<Title order={2} size='h3' c='green' mb='sm'>
							{t('myDay.today')}
						</Title>
						<Box mb='xl'>
							<TaskGrid tasks={current} />
						</Box>
					</>
				) : (
					<Text c='dimmed'>{t('myDay.nothingAdded')}</Text>
				)}
			</Box>

			<Box pt='md'>
				<OtherTasksSection tasks={otherTasks} />
			</Box>
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.MY_DAY)({
	component: MyDayPage,
})
