import { Button, Card, Container, Group, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { createLazyRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency, useDeleteTimeEntry, useProjects, useTasks, useTimeEntries, useTimeSummary } from '../api'
import { useConfirmDelete } from '../components/ConfirmDeleteModal'
import { CostInfo } from '../components/CostInfo'
import { formatDuration } from '../hooks/useTimer'
import { ROUTES } from '../routes'

function startOfDay(d: Date): number {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function localDayStart(iso: string): number {
	const d = new Date(iso)
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function TimeEntriesPage() {
	const { t } = useTranslation()
	const { data: entries = [] } = useTimeEntries()
	const { data: summary } = useTimeSummary()
	const { data: projects = [] } = useProjects()
	const { data: tasks = [] } = useTasks()
	const { data: currency = '$' } = useCurrency()
	const deleteTimeEntry = useDeleteTimeEntry()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('timeEntries.deleteTitle'),
		message: t('timeEntries.deleteBody'),
	})

	const [projectFilter, setProjectFilter] = useState<string | null>(null)
	const [taskFilter, setTaskFilter] = useState<string | null>(null)
	const [dateFrom, setDateFrom] = useState<Date | null>(null)
	const [dateTo, setDateTo] = useState<Date | null>(null)

	const projectId = projectFilter ? Number(projectFilter) : null
	const taskOptions = tasks
		.filter((task) => (projectId == null || task.projectId === projectId) && task.id != null)
		.map((task) => ({ value: String(task.id), label: task.name }))

	const filtered = entries.filter((entry) => {
		if (projectId != null && entry.projectId !== projectId) return false
		if (taskFilter && entry.taskId !== Number(taskFilter)) return false
		const ts = localDayStart(entry.startTime)
		if (dateFrom && ts < startOfDay(dateFrom)) return false
		if (dateTo && ts > startOfDay(dateTo)) return false
		return true
	})

	const filteredDuration = filtered.reduce((acc, e) => acc + (e.duration ?? 0), 0)
	const filteredCost = filtered.reduce((acc, e) => acc + (e.cost ?? 0), 0)

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

			<Group align='flex-end' mb='md' wrap='wrap'>
				<Select
					label={t('projects.title')}
					placeholder={t('timeEntries.allProjects')}
					clearable
					data={projects.map((p) => ({ value: String(p.id), label: p.name }))}
					value={projectFilter}
					onChange={(v) => {
						setProjectFilter(v)
						setTaskFilter(null)
					}}
					w={200}
					searchable
				/>
				<Select
					label={t('timeEntries.task')}
					placeholder={t('timeEntries.allTasks')}
					clearable
					data={taskOptions}
					value={taskFilter}
					onChange={setTaskFilter}
					w={200}
					searchable
				/>
				<DateInput
					label={t('timeEntries.from')}
					value={dateFrom}
					onChange={(v) => setDateFrom(v as Date | null)}
					clearable
					w={160}
				/>
				<DateInput
					label={t('timeEntries.to')}
					value={dateTo}
					onChange={(v) => setDateTo(v as Date | null)}
					clearable
					w={160}
				/>
			</Group>

			{filtered.length === 0 ? (
				<Stack gap='sm'>
					<Text c='dimmed'>{t('timeEntries.none')}</Text>
					{entries.length > 0 && <Text c='dimmed'>{t('timeEntries.noMatch')}</Text>}
				</Stack>
			) : (
				<>
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
							{filtered.map((entry) => (
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
				</>
			)}
			{confirmDeleteModal}
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.TIME_ENTRIES)({
	component: TimeEntriesPage,
})
