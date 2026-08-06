import { ActionIcon, Anchor, Card, Group, Menu, Spoiler, Stack, Text } from '@mantine/core'
import { IconDots, IconEye, IconFolder, IconPencil, IconSun, IconTrash } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useClearMyDay, useDeleteTask, useProjects, useStatuses, useToggleMyDay } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'
import { MarkdownPreview } from './MarkdownPreview'
import { MyDayControl } from './MyDayControl'
import { TimerControl } from './TimerControl'

interface TaskCardProps {
	task: Task
}

function getMyDayState(myDayDate: string | null | undefined): 'none' | 'today' | 'overdue' {
	if (!myDayDate) return 'none'
	const today = new Date().toISOString().split('T')[0]
	if (myDayDate === today) return 'today'
	return 'overdue'
}

export function TaskCard({ task }: TaskCardProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const deleteTask = useDeleteTask()
	const toggleMyDay = useToggleMyDay()
	const clearMyDay = useClearMyDay()
	const { data: statuses } = useStatuses()
	const { data: projects } = useProjects()

	const status = statuses?.find((s) => s.id === task.statusId)
	const project = projects?.find((p) => p.id === task.projectId)
	const myDayState = getMyDayState(task.my_day_date ?? null)

	const handleMyDayToggle = () => {
		if (myDayState === 'none') toggleMyDay.mutate(task.id)
		else clearMyDay.mutate(task.id)
	}

	const menuItems = (
		<>
			<MyDayControl variant='menu-item' inMyDay={myDayState !== 'none'} onToggle={handleMyDayToggle} />
			<Menu.Divider />
			<Menu.Item
				leftSection={<IconEye size={14} />}
				onClick={() => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(task.id) } })}
			>
				{t('common.view')}
			</Menu.Item>
			<Menu.Item
				leftSection={<IconPencil size={14} />}
				onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task.id) } })}
			>
				{t('common.edit')}
			</Menu.Item>
			<Menu.Divider />
			<Menu.Item color='red' leftSection={<IconTrash size={14} />} onClick={() => deleteTask.mutate(task.id)}>
				{t('common.delete')}
			</Menu.Item>
		</>
	)

	return (
		<Card withBorder padding='sm' radius='md'>
			<Menu>
				<Menu.ContextMenu>
					<Stack gap={8}>
						<Group justify='space-between' align='flex-start' gap='xs' wrap='nowrap'>
							<div style={{ flex: 1, minWidth: 0 }}>
								<Group gap='xs' align='center' wrap='wrap'>
									<Anchor
										component='button'
										fw={500}
										style={{ textAlign: 'left' }}
										onClick={() => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(task.id) } })}
									>
										{task.name}
									</Anchor>
									{myDayState === 'overdue' && (
										<Text size='xs' c='red'>
											{t('tasks.overdue')}
										</Text>
									)}
								</Group>
							</div>
							<Group gap='xs' wrap='nowrap' align='center'>
								<TimerControl taskId={task.id} duration={task.total_duration} />
								<Menu shadow='md' width={200} position='bottom-end'>
									<Menu.Target>
										<ActionIcon variant='subtle' color='gray' size='sm' aria-label={t('tasks.actions')}>
											<IconDots size={16} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>{menuItems}</Menu.Dropdown>
								</Menu>
							</Group>
						</Group>

						{/* {task.description_md && (
							<Spoiler maxHeight={80} showLabel='Show more' hideLabel='Hide'>
								<MarkdownPreview content={task.description_md} variant='preview' />
							</Spoiler>
						)} */}

						<Group gap='md' align='center'>
							{myDayState !== 'none' && (
								<Group gap={5} align='center' c='blue'>
									<IconSun size={14} />
									<Text size='xs'>{t('myDay.title')}</Text>
								</Group>
							)}
							{status && (
								<Group
									gap={5}
									align='center'
									px={6}
									py={2}
									style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}
								>
									<div
										style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }}
									/>
									<Text size='xs'>{status.name}</Text>
								</Group>
							)}
							{project && (
								<Group
									gap={5}
									align='center'
									px={6}
									py={2}
									style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}
								>
									<IconFolder size={12} color='var(--mantine-color-dimmed)' />
									<Text size='xs' c='dimmed'>
										{project.name}
									</Text>
								</Group>
							)}
							<Text size='xs' c='dimmed'>
								{new Date(task.created_at).toLocaleString()}
							</Text>
						</Group>
					</Stack>
				</Menu.ContextMenu>
				<Menu.Dropdown>{menuItems}</Menu.Dropdown>
			</Menu>
		</Card>
	)
}
