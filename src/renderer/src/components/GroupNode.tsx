import { ActionIcon, ColorInput, Group, TextInput } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { type Node, type NodeProps, NodeResizer } from '@xyflow/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Group as GroupModel } from '../../../shared/api'
import { useDeleteGroup, useUpdateGroup } from '../api'

export type GroupNodeData = { group: GroupModel }
export type GroupNodeType = Node<GroupNodeData, 'group'>

function withAlpha(hex: string, alpha: number): string {
	const h = hex.replace('#', '')
	const full =
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h
	const n = parseInt(full, 16)
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function GroupNode({ data, selected }: NodeProps<GroupNodeType>) {
	const { group } = data
	const updateGroup = useUpdateGroup()
	const deleteGroup = useDeleteGroup()
	const { t } = useTranslation()
	const [name, setName] = useState(group.name)
	const [color, setColor] = useState(group.color)

	useEffect(() => {
		setName(group.name)
		setColor(group.color)
	}, [group.name, group.color])

	return (
		<>
			<NodeResizer minWidth={200} minHeight={120} isVisible={selected} lineStyle={{ borderColor: group.color }} />
			<div
				style={{
					width: '100%',
					height: '100%',
					borderRadius: 14,
					border: `2px solid ${group.color}`,
					background: withAlpha(group.color, 0.18),
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Group px={10} py={6} gap='xs' wrap='nowrap' align='center'>
					<TextInput
						className='nodrag'
						size='xs'
						variant='unstyled'
						fw={600}
						flex={1}
						miw={0}
						value={name}
						placeholder={t('tasks.groupName')}
						onChange={(e) => setName(e.currentTarget.value)}
						onBlur={() => {
							if (name.trim() && name !== group.name) updateGroup.mutate({ id: group.id, name: name.trim() })
						}}
					/>
					<ColorInput
						className='nodrag'
						size='xs'
						w={110}
						format='hex'
						value={color}
						onChange={setColor}
						onChangeEnd={(c) => {
							if (c !== group.color) updateGroup.mutate({ id: group.id, color: c })
						}}
						aria-label={t('tasks.groupColor')}
					/>
					<ActionIcon
						className='nodrag'
						variant='subtle'
						color='red'
						size='sm'
						onClick={() => deleteGroup.mutate(group.id)}
						aria-label={t('common.delete')}
					>
						<IconTrash size={14} />
					</ActionIcon>
				</Group>
			</div>
		</>
	)
}
