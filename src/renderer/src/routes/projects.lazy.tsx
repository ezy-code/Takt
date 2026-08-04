import { Container, Title, Stack, Text, Button, Group, Card, Anchor, Menu, ActionIcon } from '@mantine/core'
import { useNavigate, createLazyRoute } from '@tanstack/react-router'
import { IconPlus, IconDots, IconPencil } from '@tabler/icons-react'
import { useProjects } from '../api'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { ROUTES } from '../routes'

const Route = createLazyRoute(ROUTES.PROJECTS)({
  component: ProjectsPage,
})

function ProjectsPage() {
  const navigate = useNavigate()
  const { data: projects, isLoading } = useProjects()

  return (
    <Container fluid py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Projects</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate({ to: ROUTES.PROJECTS_NEW })}
        >
          New Project
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !projects || projects.length === 0 ? (
        <Text c="dimmed">No projects yet. Create one.</Text>
      ) : (
        <Stack>
          {projects.map((project) => (
            <Card key={project.id} withBorder padding="sm" radius="md">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Anchor component="button" fw={500} style={{ textAlign: 'left' }} onClick={() => navigate({ to: ROUTES.PROJECT_EDIT, params: { id: String(project.id) } })}>
                      {project.name}
                    </Anchor>
                  </Group>
                  <MarkdownPreview content={project.description_md} maxLength={200} />
                  <Text size="xs" c="gray" mt={4}>
                    {new Date(project.created_at).toLocaleString()}
                  </Text>
                </div>
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Project actions">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconPencil size={14} />}
                      onClick={() => navigate({ to: ROUTES.PROJECT_EDIT, params: { id: String(project.id) } })}
                    >
                      Edit
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}

export { Route }