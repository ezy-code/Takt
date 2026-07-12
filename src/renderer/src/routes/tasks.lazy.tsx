import { useEffect } from 'react'
import { Container, Title, Stack, Text, Button, Group } from '@mantine/core'
import { useNavigate, createLazyRoute } from '@tanstack/react-router'
import { IconPlus } from '@tabler/icons-react'
import { useTasks, useActiveTimer } from '../api'
import { useTimerStore } from '../store/timer'
import { TaskCard } from '../components/TaskCard'

function TasksPage() {
  const navigate = useNavigate()
  const { data: tasks, isLoading } = useTasks()
  const { data: activeTimer } = useActiveTimer()
  const setActive = useTimerStore((s) => s.setActive)

  useEffect(() => {
    if (activeTimer) {
      setActive(activeTimer.entry, activeTimer.task)
    } else {
      setActive(null, null)
    }
  }, [activeTimer, setActive])

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Tasks</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate({ to: '/tasks/new' })}
        >
          New Task
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !tasks || tasks.length === 0 ? (
        <Text c="dimmed">No tasks yet. Create one.</Text>
      ) : (
        <Stack>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      )}
    </Container>
  )
}

export const Route = createLazyRoute('/tasks')({
  component: TasksPage,
})
