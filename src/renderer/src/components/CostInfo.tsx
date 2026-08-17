import { type MantineSize, Text, Tooltip } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import type { RateSource } from '../../../shared/api'
import { formatMoney, formatRate } from '../hooks/useCost'

const SOURCE_KEYS = {
	task: 'cost.source.task',
	default: 'cost.source.default',
} as const

interface CostInfoProps {
	cost: number
	rate: number
	rateSource: RateSource
	currency: string
	showRate?: boolean
	size?: MantineSize
}

export function CostInfo({ cost, rate, rateSource, currency, showRate = true, size = 'md' }: CostInfoProps) {
	const { t } = useTranslation()
	const inner = (
		<Text fw={600} size={size} style={{ fontVariantNumeric: 'tabular-nums' }} tabIndex={0}>
			{formatMoney(cost, currency)}
		</Text>
	)
	if (!showRate) return inner
	return (
		<Tooltip label={`${formatRate(rate, currency, t('cost.unit'))} · ${t(SOURCE_KEYS[rateSource])}`} openDelay={400}>
			{inner}
		</Tooltip>
	)
}
