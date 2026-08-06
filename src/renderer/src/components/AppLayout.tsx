import { ActionIcon, AppShell, Box, Group, NavLink, Text, Title } from '@mantine/core'
import { IconCalendarCheck, IconClock, IconFolder, IconList, IconPlus, IconSettings } from '@tabler/icons-react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '../../../shared/constants'
import { useActiveTimer } from '../api'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'
import { TimerControl } from './TimerControl'

const navItems = [
	{ labelKey: 'nav.myDay', path: ROUTES.MY_DAY, icon: IconCalendarCheck },
	{ labelKey: 'nav.tasks', path: ROUTES.TASKS, icon: IconList },
	{ labelKey: 'nav.projects', path: ROUTES.PROJECTS, icon: IconFolder },
	{ labelKey: 'nav.timeEntries', path: ROUTES.TIME_ENTRIES, icon: IconClock },
	{ labelKey: 'nav.settings', path: ROUTES.SETTINGS, icon: IconSettings },
] as const

export default function AppLayout() {
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()
	const { activeEntry, activeTask, setActive } = useTimerStore()
	const { data: activeTimer } = useActiveTimer()

	useEffect(() => {
		if (activeTimer) {
			setActive(activeTimer.entry, activeTimer.task)
		} else {
			setActive(null, null)
		}
	}, [activeTimer, setActive])

	useEffect(() => {
		return window.api.onNavigateToTask((id) => {
			navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
		})
	}, [navigate])

	return (
		<AppShell padding='md' header={{ height: 56 }} navbar={{ width: 220, breakpoint: 0 }}>
			<AppShell.Header p='md'>
				<Group h='100%' gap='md'>
					<Title order={3}>{APP_NAME}</Title>
					{activeEntry && activeTask && (
						<>
							<Box
								style={{
									width: 4,
									height: 4,
									borderRadius: '50%',
									backgroundColor: 'var(--mantine-color-green-6)',
									flexShrink: 0,
								}}
							/>
							<Text size='sm' fw={500} c='green'>
								{activeTask.name}
							</Text>
							<TimerControl taskId={activeEntry.taskId} duration={activeTask.total_duration} />
						</>
					)}
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p='xs'>
				{navItems.map((item) => (
					<NavLink
						key={item.path}
						label={t(item.labelKey)}
						leftSection={item.icon && <item.icon size={16} />}
						active={location.pathname === item.path}
						onClick={() => navigate({ to: item.path })}
						rightSection={
							item.path === ROUTES.TASKS ? (
								<ActionIcon
									variant='subtle'
									color='gray'
									size='sm'
									onClick={(e) => {
										e.stopPropagation()
										navigate({ to: ROUTES.TASKS_NEW })
									}}
								>
									<IconPlus size={14} />
								</ActionIcon>
							) : undefined
						}
					/>
				))}
			</AppShell.Navbar>

			<AppShell.Main>
				<Outlet />
			</AppShell.Main>
		</AppShell>
	)
}
