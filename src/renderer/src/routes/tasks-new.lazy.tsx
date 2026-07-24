import { useRef } from 'react'
import { Container, Title, TextInput, Button, Group, Stack, Text } from '@mantine/core'
import { useNavigate, createLazyRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useAddTask } from '../api'
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import { ROUTES } from '../routes'

function TasksNewPage() {
  const navigate = useNavigate()
  const addTask = useAddTask()
  const editorRef = useRef<ExtensiveEditorRef>(null)

  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return
        const description = editorRef.current?.getJSON() ?? '{}';
        await addTask.mutateAsync({ name: value.name.trim(), description: description });
      navigate({ to: ROUTES.TASKS })
    },
  })

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">New Task</Title>
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
              defaultContent=""
              initialMode="markdown"
              placeholder="Enter task description (optional)"
              initialTheme="dark"
              availableModes={["visual-editor", "markdown"]}
              slashCommandVisibility
            />
          </div>
          <Group justify="space-between">
            <Button variant="default" onClick={() => navigate({ to: ROUTES.TASKS })}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}

export const Route = createLazyRoute(ROUTES.TASKS_NEW)({
  component: TasksNewPage,
})
