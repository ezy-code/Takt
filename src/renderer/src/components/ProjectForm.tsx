import { useRef, useEffect, type FormEvent } from 'react'
import { Container, Title, TextInput, Button, Stack, Text, Group } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMantineColorScheme } from '@mantine/core'
import { useAddProject, useUpdateProject, useProject } from '../api'
import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import { ROUTES } from '../routes'

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
  e.preventDefault()
  const submitter = (e.nativeEvent as SubmitEvent).submitter
  if (submitter && submitter.getAttribute('type') !== 'submit') return
  submit()
}

interface ProjectFormProps {
  id?: number
}

export function ProjectForm({ id }: ProjectFormProps) {
  const navigate = useNavigate()
  const editorRef = useRef<ExtensiveEditorRef>(null)
  const isEdit = id != null
  const { colorScheme } = useMantineColorScheme()
  const editorTheme = colorScheme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : colorScheme

  const { data: project, isLoading } = useProject(id ?? 0)
  const addProject = useAddProject()
  const updateProject = useUpdateProject()

  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return
      const editor = editorRef.current
      const description = editor?.getJSON() ?? ''
      const description_md = editor?.getMarkdown() ?? ''
      const description_html = editor?.getHTML() ?? ''
      if (isEdit) {
        await updateProject.mutateAsync({ id: id!, name: value.name.trim(), description, description_md, description_html })
        navigate({ to: ROUTES.PROJECTS })
      } else {
        await addProject.mutateAsync({ name: value.name.trim(), description, description_md, description_html })
        navigate({ to: ROUTES.PROJECTS })
      }
    },
  })

  useEffect(() => {
    if (isEdit && project) {
      form.setFieldValue('name', project.name)
    }
  }, [isEdit, project, form])

  if (isEdit && isLoading) return <Container fluid py="xl"><Text c="dimmed">Loading...</Text></Container>
  if (isEdit && !project) return <Container fluid py="xl"><Text c="red">Project not found</Text></Container>

  return (
    <Container fluid py="xl" pb={90}>
      <Title order={1} mb="lg">{isEdit ? 'Edit Project' : 'New Project'}</Title>
      <form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
        <Stack>
          <form.Field name="name">
            {(field) => (
              <TextInput
                label="Name"
                placeholder="Enter project name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                data-autofocus
                required
              />
            )}
          </form.Field>

          <div>
            <Text size="sm" fw={500} mb={4}>Description</Text>
            <ExtensiveEditor
              ref={editorRef}
              defaultContent={project?.description ?? ''}
              initialMode="visual-editor"
              placeholder="Enter project description (optional)"
              initialTheme={editorTheme}
              availableModes={['visual-editor', 'markdown']}
              slashCommandVisibility
            />
          </div>

          <Group
            justify="space-between"
            bg="var(--mantine-color-body)"
            py="md"
            px="lg"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid var(--mantine-color-default-border)',
              zIndex: 1000,
            }}
          >
            <Button variant="default" onClick={() => navigate({ to: ROUTES.PROJECTS })}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save' : 'Create'}</Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}