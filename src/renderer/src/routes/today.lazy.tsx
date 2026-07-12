import { useEffect } from 'react'
import { Container, Title, Stack, Text } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useTodayTasks, useActiveTimer } from '../api'
import { useTimerStore } from '../store/timer'
import { TaskCard } from '../components/TaskCard'

function TodayPage() {
  const { data: todayTasks } = useTodayTasks()
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
  const tasks = todayTasks ?? []
  const overdue = tasks.filter((t) => t.today_date && t.today_date < today)
  const current = tasks.filter((t) => t.today_date === today)

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="lg">Today</Title>

      {overdue.length > 0 && (
        <>
          <Title order={2} size="h3" c="red" mb="sm">Overdue</Title>
          <Stack mb="xl">
            {overdue.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Stack>
        </>
      )}

      {current.length > 0 ? (
        <>
          <Title order={2} size="h3" c="green" mb="sm">Today</Title>
          <Stack mb="xl">
            {current.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Stack>
        </>
      ) : (
        <Text c="dimmed">Nothing added yet.</Text>
      )}
    </Container>
  )
}

export const Route = createLazyRoute('/tasks/today')({
  component: TodayPage,
})
