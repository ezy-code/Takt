import { Button, Group, Select } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'

type FilterOption = {
	value: string
	label: string
}

interface TimeEntryFiltersProps {
	taskFilter: string | null
	dateFrom: string | null
	dateTo: string | null
	taskOptions: FilterOption[]
	onTaskChange: (value: string | null) => void
	onDateFromChange: (value: string | null) => void
	onDateToChange: (value: string | null) => void
	onReset: () => void
}

export function TimeEntryFilters({
	taskFilter,
	dateFrom,
	dateTo,
	taskOptions,
	onTaskChange,
	onDateFromChange,
	onDateToChange,
	onReset,
}: TimeEntryFiltersProps) {
	const { t } = useTranslation()
	const hasFilters = taskFilter != null || dateFrom != null || dateTo != null

	return (
		<Group align='flex-end' mb='md' wrap='wrap'>
			<Select
				label={t('timeEntries.task')}
				placeholder={t('timeEntries.allTasks')}
				clearable
				data={taskOptions}
				value={taskFilter}
				onChange={onTaskChange}
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
