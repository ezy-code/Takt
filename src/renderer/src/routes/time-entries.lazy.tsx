import { Button, Card, Container, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCurrency, useDeleteTimeEntry, useTimeSummary } from '../api'
import { useConfirmDelete } from '../components/ConfirmDeleteModal'
import { CostInfo } from '../components/CostInfo'
import { TimeEntryFilters } from '../components/TimeEntryFilters'
import { useTimeEntryFilters } from '../hooks/useTimeEntryFilters'
import { formatDuration } from '../hooks/useTimer'
import { ROUTES } from '../routes'

function TimeEntriesPage() {
	const { t } = useTranslation()
	const { data: summary } = useTimeSummary()
	const { data: currency = '$' } = useCurrency()
	const deleteTimeEntry = useDeleteTimeEntry()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('timeEntries.deleteTitle'),
		message: t('timeEntries.deleteBody'),
	})
	const {
		projectFilter,
		taskFilter,
		dateFrom,
		dateTo,
		projectOptions,
		taskOptions,
		handleProjectChange,
		setTaskFilter,
		setDateFrom,
		setDateTo,
		filteredEntries,
		filteredDuration,
		filteredCost,
		entriesCount,
		reset,
	} = useTimeEntryFilters()

	return (
		<Container fluid py='xl'>
			<Title order={1} mb='lg'>
				{t('timeEntries.title')}
			</Title>

			{summary && (
				<SimpleGrid cols={3} mb='xl'>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							{t('timeEntries.totalSessions')}
						</Text>
						<Text size='xl' fw={700}>
							{summary.totalSessions}
						</Text>
					</Card>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							{t('timeEntries.totalTime')}
						</Text>
						<Text size='xl' fw={700}>
							{formatDuration(summary.totalDuration)}
						</Text>
						<Text size='sm' fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
							{t('cost.total')}:{' '}
							<CostInfo cost={summary.totalCost} rate={0} rateSource='default' currency={currency} showRate={false} />
						</Text>
					</Card>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							{t('timeEntries.today')}
						</Text>
						<Text size='xl' fw={700}>
							{formatDuration(summary.todayDuration)}
						</Text>
						<Text size='sm' fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
							{t('cost.total')}:{' '}
							<CostInfo cost={summary.todayCost} rate={0} rateSource='default' currency={currency} showRate={false} />
						</Text>
					</Card>
				</SimpleGrid>
			)}

			<TimeEntryFilters
				projectFilter={projectFilter}
				taskFilter={taskFilter}
				dateFrom={dateFrom}
				dateTo={dateTo}
				projectOptions={projectOptions}
				taskOptions={taskOptions}
				onProjectChange={handleProjectChange}
				onTaskChange={setTaskFilter}
				onDateFromChange={setDateFrom}
				onDateToChange={setDateTo}
				onReset={reset}
			/>

			{filteredEntries.length === 0 ? (
				<Stack gap='sm'>
					<Text c='dimmed'>{t('timeEntries.none')}</Text>
					{entriesCount > 0 && <Text c='dimmed'>{t('timeEntries.noMatch')}</Text>}
				</Stack>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>{t('timeEntries.task')}</Table.Th>
							<Table.Th>{t('timeEntries.start')}</Table.Th>
							<Table.Th>{t('timeEntries.stop')}</Table.Th>
							<Table.Th>{t('timeEntries.duration')}</Table.Th>
							<Table.Th>{t('cost.total')}</Table.Th>
							<Table.Th w={100}></Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{filteredEntries.map((entry) => (
							<Table.Tr key={entry.id}>
								<Table.Td fw={500}>{entry.taskName}</Table.Td>
								<Table.Td>{new Date(entry.startTime).toLocaleString()}</Table.Td>
								<Table.Td>
									{entry.stopTime ? (
										new Date(entry.stopTime).toLocaleString()
									) : (
										<Text c='green'>{t('timeEntries.inProgress')}</Text>
									)}
								</Table.Td>
								<Table.Td>
									{entry.stopTime === null ? (
										<Text c='green'>{t('timeEntries.inProgress')}</Text>
									) : (
										formatDuration(entry.duration ?? 0)
									)}
								</Table.Td>
								<Table.Td>
									{entry.rate != null && entry.rateSource != null ? (
										<CostInfo
											cost={entry.cost ?? 0}
											rate={entry.rate}
											rateSource={entry.rateSource}
											currency={currency}
										/>
									) : (
										'-'
									)}
								</Table.Td>
								<Table.Td>
									<Button
										variant='light'
										color='red'
										size='xs'
										onClick={() => confirmDelete(() => deleteTimeEntry.mutate(entry.id))}
									>
										{t('common.delete')}
									</Button>
								</Table.Td>
							</Table.Tr>
						))}
						<Table.Tr>
							<Table.Td fw={700}>{t('timeEntries.total')}</Table.Td>
							<Table.Td></Table.Td>
							<Table.Td></Table.Td>
							<Table.Td fw={700}>{formatDuration(filteredDuration)}</Table.Td>
							<Table.Td fw={700}>
								<CostInfo cost={filteredCost} rate={0} rateSource='default' currency={currency} showRate={false} />
							</Table.Td>
							<Table.Td></Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
			)}
			{confirmDeleteModal}
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.TIME_ENTRIES)({
	component: TimeEntriesPage,
})
