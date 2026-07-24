import { useEffect, useCallback } from 'react'
import { AppShell, NavLink, Title, Group, Text, Button, ActionIcon, Box } from '@mantine/core'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { IconBell, IconPlus, IconList, IconCalendarCheck, IconClock } from '@tabler/icons-react'
import { useTimerStore } from '../store/timer'
import { useActiveTimer } from '../api'
import { TimerControl } from './TimerControl'
import { ROUTES } from '../routes'

const navItems = [
  { label: 'Tasks', path: ROUTES.TASKS, icon: IconList },
  { label: 'Today', path: ROUTES.TASKS_TODAY, icon: IconCalendarCheck },
  { label: 'Time Entries', path: ROUTES.TIME_ENTRIES, icon: IconClock },
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
    window.api.showNotification('Tact', 'Уведомление сейчас!')
  }, [])

  const showNotificationDelayed = useCallback(() => {
    setTimeout(() => {
      window.api.showNotification('Tact', 'Уведомление через 20 секунд!')
    }, 20000)
  }, [])

  return (
    <AppShell
      padding="md"
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 0 }}
    >
      <AppShell.Header p="md">
        <Group h="100%" gap="md">
          <Title order={3}>Tact</Title>
          {activeEntry && activeTask && (
            <>
              <Box style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-6)', flexShrink: 0 }} />
              <Text size="sm" fw={500} c="green">{activeTask.name}</Text>
              <TimerControl taskId={activeEntry.taskId} duration={activeTask.total_duration} />
            </>
          )}
          <Group ml="auto" gap="xs">
            <Button
              variant="light"
              size="compact-sm"
              leftSection={<IconBell size={14} />}
              onClick={showNotificationNow}
            >
              Сейчас
            </Button>
            <Button
              variant="light"
              size="compact-sm"
              leftSection={<IconBell size={14} />}
              onClick={showNotificationDelayed}
            >
              Через 20с
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={item.icon && <item.icon size={16} />}
            active={location.pathname === item.path}
            onClick={() => navigate({ to: item.path })}
            rightSection={item.path === ROUTES.TASKS ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: ROUTES.TASKS_NEW })
                }}
              >
                <IconPlus size={14} />
              </ActionIcon>
            ) : undefined}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
