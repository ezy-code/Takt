import { Badge, type BadgeProps } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { EntityType } from '../types'

const ENTITY_BADGE_COLORS: Record<EntityType, string> = {
	task: 'blue',
	note: 'yellow',
	project: 'violet',
}

interface EntityTypeBadgeProps extends BadgeProps {
	entityType?: EntityType
}

export function EntityTypeBadge({ entityType, ...props }: EntityTypeBadgeProps) {
	const { t } = useTranslation()
	return (
		<Badge size='xs' variant='outline' color={ENTITY_BADGE_COLORS[entityType ?? 'task']} {...props}>
			{t(`entity.${entityType ?? 'task'}`)}
		</Badge>
	)
}
