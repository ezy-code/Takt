import { Button, Group, Select } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

type FilterOption = {
	value: string
	label: string
}

interface TimeEntryFiltersProps {
	itemFilter: string | null
	dateFrom: string | null
	dateTo: string | null
	itemOptions: FilterOption[]
	onItemChange: (value: string | null) => void
	onDateFromChange: (value: string | null) => void
	onDateToChange: (value: string | null) => void
	onReset: () => void
}

export function TimeEntryFilters({
	itemFilter,
	dateFrom,
	dateTo,
	itemOptions,
	onItemChange,
	onDateFromChange,
	onDateToChange,
	onReset,
}: TimeEntryFiltersProps) {
	const { t } = useTranslation()
	const hasFilters = itemFilter != null || dateFrom != null || dateTo != null

	return (
		<Group align='flex-end' mb='md' wrap='wrap'>
			<Select
				label={t('timeEntries.item')}
				placeholder={t('timeEntries.allItems')}
				clearable
				data={itemOptions}
				value={itemFilter}
				onChange={onItemChange}
				w={200}
				searchable
			/>
			<DateInput label={t('timeEntries.from')} value={dateFrom} onChange={onDateFromChange} clearable w={160} />
			<DateInput label={t('timeEntries.to')} value={dateTo} onChange={onDateToChange} clearable w={160} />
			{hasFilters && (
				<Button variant='default' mt={22} onClick={onReset}>
					{t('common.reset')}
				</Button>
			)}
		</Group>
	)
}
