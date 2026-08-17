import { ActionIcon, Box, Group, Text, Title } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item } from '../types'
import { ItemGrid } from './ItemGrid'

interface OtherItemsSectionProps {
	items: Item[]
}

export function OtherItemsSection({ items }: OtherItemsSectionProps) {
	const { t } = useTranslation()
	const [expanded, setExpanded] = useState(false)

	return items.length > 0 ? (
		<>
			<Group gap='xs' mb='sm' style={{ cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
				<Title order={2} size='h3'>
					{t('myDay.otherItems')}
				</Title>
				<ActionIcon variant='subtle' color='gray' size='sm'>
					<IconChevronDown
						style={{
							transform: expanded ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s',
						}}
					/>
				</ActionIcon>
			</Group>
			<Box style={{ position: 'relative' }}>
				<Box style={expanded ? { maxHeight: '60vh', overflowY: 'auto' } : { maxHeight: 40, overflow: 'hidden' }}>
					<ItemGrid items={expanded ? items : items.slice(0, 3)} />
				</Box>
				{!expanded && (
					<Box
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							height: 48,
							pointerEvents: 'none',
							background: 'linear-gradient(to bottom, transparent, var(--mantine-color-body))',
						}}
					/>
				)}
			</Box>
		</>
	) : (
		<Text c='dimmed'>{t('myDay.noOtherItems')}</Text>
	)
}
