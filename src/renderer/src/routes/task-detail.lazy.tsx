import { Container, Title, Text, Button, Group, Stack, Paper } from '@mantine/core'
import { useNavigate, createLazyRoute, useParams } from '@tanstack/react-router'
import { IconFolder } from '@tabler/icons-react'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { useTask, useStatuses, useProjects } from '../api'
import { ROUTES } from '../routes'

function TaskDetailPage() {
  const { id } = useParams({ from: ROUTES.TASK_DETAIL })
  const { data: task, isLoading } = useTask(Number(id))
  const { data: statuses } = useStatuses()
  const { data: projects } = useProjects()
  const navigate = useNavigate()

  const status = statuses?.find((s) => s.id === task?.statusId)
  const project = projects?.find((p) => p.id === task?.projectId)

  if (isLoading) return <Container fluid py="xl"><Text c="dimmed">Loading...</Text></Container>
  if (!task) return <Container fluid py="xl"><Text c="red">Task not found</Text></Container>

  return (
    <Container fluid py="xl">
      <Stack>
        <Group justify="space-between">
          <Title order={1}>{task.name}</Title>
          <Group>
            <Button variant="default" onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id } })}>
              Edit
            </Button>
            <Button variant="default" onClick={() => navigate({ to: ROUTES.TASKS })}>
              Back
            </Button>
          </Group>
        </Group>
        {status && (
          <Group gap="xs">
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
            <Text size="sm">{status.name}</Text>
          </Group>
        )}
        {project && (
          <Group gap="xs">
            <IconFolder size={16} c="dimmed" />
            <Text size="sm">{project.name}</Text>
          </Group>
        )}
        <Text size="xs" c="gray">
          Created: {new Date(task.created_at).toLocaleString()}
        </Text>
        {task.description_md && (
          <MarkdownPreview content={task.description_md} variant="full" />
        )}
      </Stack>
    </Container>
  )
}

export const Route = createLazyRoute(ROUTES.TASK_DETAIL)({
  component: TaskDetailPage,
})
