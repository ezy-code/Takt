import { useEffect } from 'react'
import { Container, Title, Stack, Text, Button, Group, Tabs } from '@mantine/core'
import { useNavigate, createLazyRoute } from '@tanstack/react-router'
import { IconPlus, IconList, IconColumns } from '@tabler/icons-react'
import { useTasks, useActiveTimer } from '../api'
import { useTimerStore } from '../store/timer'
import { TaskCard } from '../components/TaskCard'
import { KanbanBoard } from '../components/KanbanBoard'
import { ManageStatusesModal } from '../components/ManageStatusesModal'

const Route = createLazyRoute('/tasks')({
  component: TasksPage,
})

function TasksPage() {
  const navigate = useNavigate()
  const { tab } = Route.useSearch()
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
    <Container size={tab === 'kanban' ? 'xl' : 'md'} py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Tasks</Title>
        {tab === 'list' ? (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate({ to: '/tasks/new' })}
          >
            New Task
          </Button>
        ) : (
          <ManageStatusesModal />
        )}
      </Group>

      <Tabs value={tab} onChange={(v) => navigate({ search: { tab: v }})}>
        <Tabs.List mb="md">
          <Tabs.Tab value="list" leftSection={<IconList size={14} />}>List</Tabs.Tab>
          <Tabs.Tab value="kanban" leftSection={<IconColumns size={14} />}>Kanban</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list">
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
        </Tabs.Panel>

        <Tabs.Panel value="kanban">
          <KanbanBoard />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}

export { Route }
