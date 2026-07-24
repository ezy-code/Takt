import { useRef } from 'react'
import { Container, Title, TextInput, Button, Group, Stack, Text } from '@mantine/core'
import { useNavigate, createLazyRoute, useParams } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useTask, useUpdateTask } from '../api'
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import { ROUTES } from '../routes'

function TasksEditPage() {
  const { id } = useParams({ from: ROUTES.TASK_EDIT })
  const navigate = useNavigate()
  const { data: task, isLoading } = useTask(Number(id))
  const updateTask = useUpdateTask()
  const editorRef = useRef<ExtensiveEditorRef>(null)

  const form = useForm({
    defaultValues: { name: task?.name ?? '' },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return
      const description = editorRef.current?.getJSON() ?? ''
      await updateTask.mutateAsync({ id: Number(id), name: value.name.trim(), description: description })
navigate({ to: ROUTES.TASK_DETAIL, params: { id } })
    },
  })

  if (isLoading) return <Container size="sm" py="xl"><Text c="dimmed">Loading...</Text></Container>
  if (!task) return <Container size="sm" py="xl"><Text c="red">Task not found</Text></Container>

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">Edit Task</Title>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
        <Stack>
          <form.Field name="name">
            {(field) => (
              <TextInput
                label="Name"
                placeholder="Enter task name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                data-autofocus
              />
            )}
          </form.Field>
          <div>
            <Text size="sm" fw={500} mb={4}>Description</Text>
            <ExtensiveEditor
              ref={editorRef}
              defaultContent={task.description}
              initialMode="markdown"
              placeholder="Enter task description (optional)"
              initialTheme="dark"
              availableModes={["visual-editor", "markdown"]}
              slashCommandVisibility
            />
          </div>
          <Group justify="space-between">
            <Button variant="default" onClick={() => navigate({ to: ROUTES.TASK_DETAIL, params: { id } })}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}

export const Route = createLazyRoute(ROUTES.TASK_EDIT)({
  component: TasksEditPage,
})
