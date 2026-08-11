import { Group } from '@mantine/core'
import { IconCoin } from '@tabler/icons-react'
import { useCurrency } from '../api'
import type { Task } from '../types'
import { CostInfo } from './CostInfo'

export function TaskCostPill({ task }: { task: Task }) {
	const { data: currency = '$' } = useCurrency()
	const cost = task.cost ?? 0
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
				rate={task.rate ?? 0}
				rateSource={task.rateSource ?? 'default'}
				currency={currency}
				size='sm'
			/>
		</Group>
	)
}
