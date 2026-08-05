import { ActionIcon, AppShell, Box, Button, Group, NavLink, Text, Title } from '@mantine/core'
import {
	IconBell,
	IconCalendarCheck,
	IconClock,
	IconFolder,
	IconList,
	IconPlus,
	IconSettings,
} from '@tabler/icons-react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { APP_NAME } from '../../../shared/constants'
import { useActiveTimer } from '../api'
import { ROUTES } from '../routes'
import { useTimerStore } from '../store/timer'
import { TimerControl } from './TimerControl'

const navItems = [
	{ label: 'My Day', path: ROUTES.MY_DAY, icon: IconCalendarCheck },
	{ label: 'Tasks', path: ROUTES.TASKS, icon: IconList },
	{ label: 'Projects', path: ROUTES.PROJECTS, icon: IconFolder },
	{ label: 'Time Entries', path: ROUTES.TIME_ENTRIES, icon: IconClock },
	{ label: 'Settings', path: ROUTES.SETTINGS, icon: IconSettings },
]

export default function AppLayout() {
	const navigate = useNavigate()
	const location = useLocation()
	const { activeEntry, activeTask, setActive } = useTimerStore()
	const { data: activeTimer } = useActiveTimer()

	useEffect(() => {
		if (activeTimer) {
			setActive(activeTimer.entry, activeTimer.task)
		} else {
			setActive(null, null)
		}
	}, [activeTimer, setActive])

	const showNotificationNow = useCallback(() => {
		window.api.showNotification(APP_NAME, 'Уведомление сейчас!')
	}, [])

	const showNotificationDelayed = useCallback(() => {
		setTimeout(() => {
			window.api.showNotification(APP_NAME, 'Уведомление через 20 секунд!')
		}, 20000)
	}, [])

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
					<Group ml='auto' gap='xs'>
						<Button
							variant='light'
							size='compact-sm'
							leftSection={<IconBell size={14} />}
							onClick={showNotificationNow}
						>
							Сейчас
						</Button>
						<Button
							variant='light'
							size='compact-sm'
							leftSection={<IconBell size={14} />}
							onClick={showNotificationDelayed}
						>
							Через 20с
						</Button>
					</Group>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p='xs'>
				{navItems.map((item) => (
					<NavLink
						key={item.path}
						label={item.label}
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
