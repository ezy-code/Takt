import { ActionIcon, Group, Text, UnstyledButton } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import type { Item } from '../types'
import { EntityTypeBadge } from './EntityTypeBadge'

interface EntityRowProps {
	entity: Item
	onOpen: () => void
	onRemove?: () => void
	removeLabel?: string
}

export function EntityRow({ entity, onOpen, onRemove, removeLabel }: EntityRowProps) {
	return (
		<Group gap='xs' wrap='nowrap' py={6} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
			<UnstyledButton flex={1} style={{ minWidth: 0, textAlign: 'left' }} onClick={onOpen}>
				<Group gap='xs' wrap='nowrap'>
					<Text size='sm' truncate style={{ flex: 1, minWidth: 0 }}>
						{entity.name}
					</Text>
					<EntityTypeBadge entityType={entity.entityType} />
				</Group>
			</UnstyledButton>
			{onRemove && (
				<ActionIcon variant='subtle' color='red' size='sm' aria-label={removeLabel} onClick={onRemove}>
					<IconTrash size={14} />
				</ActionIcon>
			)}
		</Group>
	)
}
