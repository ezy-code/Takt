import { costOf } from '../../../shared/cost'

export { costOf }

export function formatMoney(amount: number, currency: string): string {
	if (currency) return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`
	return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function formatRate(rate: number, currency: string, unit: string): string {
	return `${rate.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}/${unit}`
}

if (import.meta.env.DEV) {
	const assert = (cond: boolean, msg: string) => {
		if (!cond) throw new Error(`useCost self-check failed: ${msg}`)
	}
	assert(costOf(3600, 30) === 30, 'costOf full hour')
	assert(Math.abs(costOf(1800, 100) - 50) < 1e-9, 'costOf half hour')
	assert(costOf(0, 50) === 0, 'costOf zero')
	assert(formatRate(30, '$', 'h') === '30 $/h', 'formatRate')
	assert(formatMoney(12.5, '€') === '12.5 €', 'formatMoney')
}
