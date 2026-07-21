import { Container, Title, Text, Button, Group, Stack, Paper } from '@mantine/core'
import { useNavigate, createLazyRoute, useParams } from '@tanstack/react-router'
import { ExtensiveEditor } from '@lyfie/luthor'
import { useTask, useStatuses } from '../api'

function TaskDetailPage() {
  const { id } = useParams({ from: '/tasks/$id' })
  const { data: task, isLoading } = useTask(Number(id))
  const { data: statuses } = useStatuses()
  const navigate = useNavigate()

  const status = statuses?.find((s) => s.id === task?.statusId)

  if (isLoading) return <Container size="sm" py="xl"><Text c="dimmed">Loading...</Text></Container>
  if (!task) return <Container size="sm" py="xl"><Text c="red">Task not found</Text></Container>

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Group justify="space-between">
          <Title order={1}>{task.name}</Title>
          <Button variant="default" onClick={() => navigate({ to: '/tasks' })}>
            Back
          </Button>
        </Group>
        {status && (
          <Group gap="xs">
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
            <Text size="sm">{status.name}</Text>
          </Group>
        )}
        <Text size="xs" c="gray">
          Created: {new Date(task.created_at).toLocaleString()}
        </Text>
        {task.description && (
          <Paper withBorder p="md" radius="md">
            <ExtensiveEditor
              defaultContent={task.description}
              initialMode="visual-only"
              availableModes={["visual-only"]}
              initialTheme="dark"
            />
          </Paper>
        )}
      </Stack>
    </Container>
  )
}

export const Route = createLazyRoute('/tasks/$id')({
  component: TaskDetailPage,
})
