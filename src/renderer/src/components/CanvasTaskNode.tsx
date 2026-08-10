import { ActionIcon, Anchor, Group, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { type Node, type NodeProps } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { useDeleteTask, useStatuses } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'
import { MarkdownPreview } from './MarkdownPreview'

export type CanvasTaskNodeData = { task: Task }
export type CanvasTaskNodeType = Node<CanvasTaskNodeData, 'canvasTask'>

export function CanvasTaskNode({ data }: NodeProps<CanvasTaskNodeType>) {
	const { task } = data
	const navigate = useNavigate()
	const { t } = useTranslation()
	const deleteTask = useDeleteTask()
	const { data: statuses } = useStatuses()
	const status = statuses?.find((s) => s.id === task.statusId)
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('tasks.deleteTitle'),
		message: t('tasks.deleteBody'),
	})

	const openEdit = () => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task.id) } })

	return (
		<>
			<div
				style={{
					width: 260,
					borderRadius: 12,
					border: '1px solid var(--mantine-color-default-border)',
					background: 'var(--mantine-color-body)',
					boxShadow: 'var(--mantine-shadow-sm)',
					overflow: 'hidden',
				}}
			>
				<div style={{ height: 6, background: status?.color ?? 'var(--mantine-color-default)' }} />
				<div style={{ padding: '10px 12px 12px' }}>
					<Anchor component='button' className='nodrag' fw={600} underline='never' onClick={openEdit}>
						{task.name}
					</Anchor>
					{task.description_md && (
						<div
							style={{
								marginTop: 6,
								color: 'var(--mantine-color-dimmed)',
								fontSize: 13,
								maxHeight: 120,
								overflow: 'hidden',
							}}
						>
							<MarkdownPreview content={task.description_md} maxLength={180} variant='preview' />
						</div>
					)}
					<Group justify='space-between' align='center' mt={10} gap='xs' wrap='nowrap'>
						{status && (
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
			{confirmDeleteModal}
		</>
	)
}
