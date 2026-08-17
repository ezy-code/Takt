import { ActionIcon, Anchor, Badge, Group, Text } from '@mantine/core'
import { IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { Handle, type Node, type NodeProps, NodeResizer, Position } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { useDeleteTask, useGroups, useStatuses, useUpdateTask } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'
import { EntityTypeBadge } from './EntityTypeBadge'
import { MarkdownPreview } from './MarkdownPreview'
import { TaskCostPill } from './TaskCostPill'

export type CanvasTaskNodeData = { task: Task }
export type CanvasTaskNodeType = Node<CanvasTaskNodeData, 'canvasTask'>

export function CanvasTaskNode({ data, selected }: NodeProps<CanvasTaskNodeType>) {
	const { task } = data
	const navigate = useNavigate()
	const { t } = useTranslation()
	const deleteTask = useDeleteTask()
	const updateTask = useUpdateTask()
	const { data: statuses } = useStatuses()
	const { data: groups } = useGroups()
	const status = statuses?.find((s) => s.id === task.statusId)
	const group = groups?.find((g) => g.id === task.groupId)
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('tasks.deleteTitle'),
		message: t('tasks.deleteBody'),
	})

	const openEdit = () => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task.id) } })

	const ungroup = () => {
		if (!group) return
		// grouped coords are relative to the group; convert to absolute before detaching
		const abs = {
			x: (task.canvasX ?? 0) + (group.canvasX ?? 0),
			y: (task.canvasY ?? 0) + (group.canvasY ?? 0),
		}
		// single mutation to avoid inconsistent intermediate rebuild
		updateTask.mutate({ id: task.id, groupId: null, canvasX: abs.x, canvasY: abs.y })
	}

	return (
		<>
			<Handle type='target' position={Position.Left} className='nodrag' />
			<NodeResizer minWidth={180} minHeight={120} isVisible={selected} />
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					borderRadius: 12,
					border: '1px solid var(--mantine-color-default-border)',
					background: 'var(--mantine-color-body)',
					boxShadow: 'var(--mantine-shadow-sm)',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						height: 6,
						background:
							task.entityType === 'task'
								? (status?.color ?? 'var(--mantine-color-default)')
								: 'var(--mantine-color-default)',
					}}
				/>
				<div
					style={{
						padding: '10px 12px 12px',
						flex: 1,
						minHeight: 0,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					<div>
						<Anchor component='button' className='nodrag' fw={600} underline='never' onClick={openEdit}>
							{task.name}
						</Anchor>
						<EntityTypeBadge entityType={task.entityType} ml={6} />
					</div>
					{task.description_md && (
						<div
							style={{
								marginTop: 6,
								color: 'var(--mantine-color-dimmed)',
								fontSize: 13,
								flex: 1,
								minHeight: 0,
								overflow: 'auto',
							}}
						>
							<MarkdownPreview content={task.description_md} variant='preview' />
						</div>
					)}
					<div style={{ marginTop: 'auto' }}>
						{group && (
							<Group gap={4} mt={6} wrap='nowrap'>
								<Badge
									size='xs'
									variant='light'
									style={{
										background: `${group.color}1a`,
										color: group.color,
										border: `1px solid ${group.color}66`,
									}}
								>
									{group.name}
								</Badge>
								<ActionIcon
									className='nodrag'
									size='xs'
									variant='subtle'
									color='gray'
									onClick={ungroup}
									aria-label={t('tasks.ungroup')}
								>
									<IconX size={10} />
								</ActionIcon>
							</Group>
						)}
						<Group justify='space-between' align='center' mt={10} gap='xs' wrap='nowrap'>
							<TaskCostPill task={task} />
							{task.entityType === 'task' && status && (
								<Group gap={5} align='center' wrap='nowrap' style={{ minWidth: 0 }}>
									<div
										style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }}
									/>
									<Text
										size='xs'
										c='dimmed'
										style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
									>
										{status.name}
									</Text>
								</Group>
							)}
							<Group gap={4} wrap='nowrap'>
								<ActionIcon
									className='nodrag'
									variant='subtle'
									color='gray'
									size='sm'
									onClick={openEdit}
									aria-label={t('common.edit')}
								>
									<IconPencil size={14} />
								</ActionIcon>
								<ActionIcon
									className='nodrag'
									variant='subtle'
									color='red'
									size='sm'
									onClick={() => confirmDelete(() => deleteTask.mutate(task.id))}
									aria-label={t('common.delete')}
								>
									<IconTrash size={14} />
								</ActionIcon>
							</Group>
						</Group>
					</div>
				</div>
			</div>
			<Handle type='source' position={Position.Right} className='nodrag' />
			{confirmDeleteModal}
		</>
	)
}
