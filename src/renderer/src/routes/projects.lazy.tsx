import { ActionIcon, Anchor, Button, Card, Container, Group, Menu, Stack, Text, Title } from '@mantine/core'
import { IconDots, IconPencil, IconPlus } from '@tabler/icons-react'
import { createLazyRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCurrency, useDefaultRate, useProjects, useTasks } from '../api'
import { CostInfo } from '../components/CostInfo'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { formatDuration } from '../hooks/useTimer'
import { ROUTES } from '../routes'

const Route = createLazyRoute(ROUTES.PROJECTS)({
	component: ProjectsPage,
})

function ProjectsPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { data: projects, isLoading } = useProjects()
	const { data: tasks = [] } = useTasks()
	const { data: defaultRate = 0 } = useDefaultRate()
	const { data: currency = '$' } = useCurrency()

	const projectStats = (projectId: number) => {
		const pts = tasks.filter((task) => task.projectId === projectId)
		const duration = pts.reduce((acc, task) => acc + (task.total_duration ?? 0), 0)
		const cost = pts.reduce((acc, task) => acc + (task.cost ?? 0), 0)
		return { duration, cost }
	}

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
									{(() => {
										const { duration, cost } = projectStats(project.id)
										const rate = project.hourly_rate ?? defaultRate
										const source = project.hourly_rate != null ? 'project' : 'default'
										return (
											<Group gap='md' mt={4}>
												<Text size='xs' c='gray'>
													{formatDuration(duration)}
												</Text>
												<CostInfo cost={cost} rate={rate} rateSource={source} currency={currency} />
											</Group>
										)
									})()}
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
