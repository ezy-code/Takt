import { ActionIcon, Group, Text, Tooltip } from '@mantine/core'
import { IconLink } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface RelatedCountProps {
	count?: number
	onClick?: () => void
}

export function RelatedCount({ count, onClick }: RelatedCountProps) {
	const { t } = useTranslation()
	if (!count) return null
	const content = (
		<Group gap={5} align='center' px={6} py={2} wrap='nowrap'>
			<IconLink size={12} color='var(--mantine-color-dimmed)' />
			<Text size='xs' c='dimmed'>
				{count}
			</Text>
		</Group>
	)
	return (
		<Tooltip label={t('entities.relatedCount', { count })}>
			{onClick ? (
				<ActionIcon
					component='button'
					variant='subtle'
					color='gray'
					size='md'
					aria-label={t('entities.relatedCount', { count })}
					onClick={onClick}
				>
					{content}
				</ActionIcon>
			) : (
				<Group style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}>{content}</Group>
			)}
		</Tooltip>
	)
}
