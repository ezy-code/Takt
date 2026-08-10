import { Button, Card, Container, SimpleGrid, Table, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDeleteTimeEntry, useTimeEntries, useTimeSummary } from '../api'
import { useConfirmDelete } from '../components/ConfirmDeleteModal'
import { formatDuration } from '../hooks/useTimer'
import { ROUTES } from '../routes'

function TimeEntriesPage() {
	const { t } = useTranslation()
	const { data: entries = [] } = useTimeEntries()
	const { data: summary } = useTimeSummary()
	const deleteTimeEntry = useDeleteTimeEntry()
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('timeEntries.deleteTitle'),
		message: t('timeEntries.deleteBody'),
	})

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
					</Card>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							{t('timeEntries.today')}
						</Text>
						<Text size='xl' fw={700}>
							{formatDuration(summary.todayDuration)}
						</Text>
					</Card>
				</SimpleGrid>
			)}

			{entries.length === 0 ? (
				<Text c='dimmed'>{t('timeEntries.none')}</Text>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>{t('timeEntries.task')}</Table.Th>
							<Table.Th>{t('timeEntries.start')}</Table.Th>
							<Table.Th>{t('timeEntries.stop')}</Table.Th>
							<Table.Th>{t('timeEntries.duration')}</Table.Th>
							<Table.Th w={80}></Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map((entry) => (
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
