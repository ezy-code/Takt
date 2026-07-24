import { useRef, type FormEvent } from 'react'
import { Container, Title, TextInput, Button, Group, Stack, Text } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useAddTask, useTask, useUpdateTask } from '../api'
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import { ROUTES } from '../routes'

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
  e.preventDefault()
  const submitter = (e.nativeEvent as SubmitEvent).submitter
  if (submitter && submitter.getAttribute('type') !== 'submit') return
  submit()
}

interface TaskFormProps {
  id?: number
}

export function TaskForm({ id }: TaskFormProps) {
  const navigate = useNavigate()
  const editorRef = useRef<ExtensiveEditorRef>(null)
  const isEdit = id != null

  const { data: task, isLoading } = useTask(id ?? 0)
  const addTask = useAddTask()
  const updateTask = useUpdateTask()

  const form = useForm({
    defaultValues: { name: task?.name ?? '' },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return
      const raw = editorRef.current?.getJSON()
      const description = raw ?? (isEdit ? '' : '{}')
      if (isEdit) {
        await updateTask.mutateAsync({ id, name: value.name.trim(), description })
        navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
      } else {
        await addTask.mutateAsync({ name: value.name.trim(), description })
        navigate({ to: ROUTES.TASKS })
      }
    },
  })

  if (isEdit && isLoading) return <Container size="sm" py="xl"><Text c="dimmed">Loading...</Text></Container>
  if (isEdit && !task) return <Container size="sm" py="xl"><Text c="red">Task not found</Text></Container>

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">{isEdit ? 'Edit Task' : 'New Task'}</Title>
      <form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
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
              defaultContent={task?.description ?? ''}
              initialMode="visual-editor"
              placeholder="Enter task description (optional)"
              initialTheme="dark"
              availableModes={["visual-editor", "markdown"]}
              slashCommandVisibility
            />
          </div>
          <Group justify="space-between">
            <Button variant="default" onClick={() => navigate({ to: isEdit ? ROUTES.TASK_DETAIL : ROUTES.TASKS, ...(isEdit ? { params: { id: String(id) } } : {}) })}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save' : 'Create'}</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}
