import { ActionIcon, Anchor, Button, Card, Container, Group, Menu, Stack, Text, Title } from '@mantine/core'
import { IconDots, IconPencil, IconPlus } from '@tabler/icons-react'
import { createLazyRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useProjects } from '../api'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { ROUTES } from '../routes'

const Route = createLazyRoute(ROUTES.PROJECTS)({
	component: ProjectsPage,
})

function ProjectsPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { data: projects, isLoading } = useProjects()

	return (
		<Container fluid py='xl'>
			<Group justify='space-between' mb='lg'>
				<Title order={1}>{t('projects.title')}</Title>
				<Button leftSection={<IconPlus size={16} />} onClick={() => navigate({ to: ROUTES.PROJECTS_NEW })}>
					{t('projects.newProject')}
				</Button>
			</Group>

			{isLoading ? (
				<Text c='dimmed'>{t('common.loading')}</Text>
			) : !projects || projects.length === 0 ? (
				<Text c='dimmed'>{t('projects.none')}</Text>
			) : (
				<Stack>
					{projects.map((project) => (
						<Card key={project.id} withBorder padding='sm' radius='md'>
							<Group justify='space-between' align='flex-start'>
								<div style={{ flex: 1 }}>
									<Group gap='xs'>
										<Anchor
											component='button'
											fw={500}
											style={{ textAlign: 'left' }}
											onClick={() => navigate({ to: ROUTES.PROJECT_EDIT, params: { id: String(project.id) } })}
										>
											{project.name}
										</Anchor>
									</Group>
									<MarkdownPreview content={project.description_md} maxLength={200} />
									<Text size='xs' c='gray' mt={4}>
										{new Date(project.created_at).toLocaleString()}
									</Text>
								</div>
								<Menu shadow='md' width={200} position='bottom-end'>
									<Menu.Target>
										<ActionIcon variant='subtle' color='gray' size='sm' aria-label={t('projects.actions')}>
											<IconDots size={16} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item
											leftSection={<IconPencil size={14} />}
											onClick={() => navigate({ to: ROUTES.PROJECT_EDIT, params: { id: String(project.id) } })}
										>
											{t('common.edit')}
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
