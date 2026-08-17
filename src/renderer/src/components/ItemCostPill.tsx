import { Group } from '@mantine/core'
import { IconCoin } from '@tabler/icons-react'
import { useCurrency } from '../api'
import type { Item } from '../types'
import { CostInfo } from './CostInfo'

export function ItemCostPill({ item }: { item: Item }) {
	const { data: currency = '$' } = useCurrency()
	const cost = item.cost ?? 0
	if (cost <= 0) return null
	return (
		<Group
			gap={5}
			align='center'
			wrap='nowrap'
			px={8}
			py={3}
			mih={30}
			style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)' }}
		>
			<IconCoin size={14} />
			<CostInfo
				cost={cost}
				rate={item.rate ?? 0}
				rateSource={item.rateSource ?? 'default'}
				currency={currency}
				size='sm'
			/>
		</Group>
	)
}
