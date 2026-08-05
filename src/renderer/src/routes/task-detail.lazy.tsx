import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconFolder, IconSun } from '@tabler/icons-react'
import { createLazyRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useProjects, useStatuses, useTask } from '../api'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { ROUTES } from '../routes'

function TaskDetailPage() {
	const { id } = useParams({ from: ROUTES.TASK_DETAIL })
	const { t } = useTranslation()
	const { data: task, isLoading } = useTask(Number(id))
	const { data: statuses } = useStatuses()
	const { data: projects } = useProjects()
	const navigate = useNavigate()

	const status = statuses?.find((s) => s.id === task?.statusId)
	const project = projects?.find((p) => p.id === task?.projectId)

	if (isLoading)
		return (
			<Container fluid py='xl'>
				<Text c='dimmed'>{t('common.loading')}</Text>
			</Container>
		)
	if (!task)
		return (
			<Container fluid py='xl'>
				<Text c='red'>{t('tasks.notFound')}</Text>
			</Container>
		)

	return (
		<Container fluid py='xl'>
			<Stack>
				<Group justify='space-between'>
					<Title order={1}>{task.name}</Title>
					<Group>
						<Button variant='default' onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id } })}>
							{t('common.edit')}
						</Button>
						<Button variant='default' onClick={() => navigate({ to: ROUTES.TASKS })}>
							{t('common.back')}
						</Button>
					</Group>
				</Group>
				{task.my_day_date && (
					<Group gap='xs' c='blue'>
						<IconSun size={16} />
						<Text size='sm'>{t('myDay.title')}</Text>
					</Group>
				)}
				{status && (
					<Group gap='xs'>
						<div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
						<Text size='sm'>{status.name}</Text>
					</Group>
				)}
				{project && (
					<Group gap='xs'>
						<IconFolder size={16} c='dimmed' />
						<Text size='sm'>{project.name}</Text>
					</Group>
				)}
				<Text size='xs' c='gray'>
					{t('projects.created', { date: new Date(task.created_at).toLocaleString() })}
				</Text>
				{task.description_md && <MarkdownPreview content={task.description_md} variant='full' />}
			</Stack>
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.TASK_DETAIL)({
	component: TaskDetailPage,
})
