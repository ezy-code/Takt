import { Button, Card, Container, SimpleGrid, Table, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useDeleteTimeEntry, useTimeEntries, useTimeSummary } from '../api'
import { TimerControl } from '../components/TimerControl'
import { formatDuration } from '../hooks/useTimer'
import { ROUTES } from '../routes'

function TimeEntriesPage() {
	const { data: entries = [] } = useTimeEntries()
	const { data: summary } = useTimeSummary()
	const deleteTimeEntry = useDeleteTimeEntry()

	const handleDelete = (id: number) => deleteTimeEntry.mutate(id)

	return (
		<Container fluid py='xl'>
			<Title order={1} mb='lg'>
				Time Entries
			</Title>

			{summary && (
				<SimpleGrid cols={3} mb='xl'>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							Total Sessions
						</Text>
						<Text size='xl' fw={700}>
							{summary.totalSessions}
						</Text>
					</Card>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							Total Time
						</Text>
						<Text size='xl' fw={700}>
							{formatDuration(summary.totalDuration)}
						</Text>
					</Card>
					<Card withBorder padding='md' radius='md'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
							Today
						</Text>
						<Text size='xl' fw={700}>
							{formatDuration(summary.todayDuration)}
						</Text>
					</Card>
				</SimpleGrid>
			)}

			{entries.length === 0 ? (
				<Text c='dimmed'>No time entries yet.</Text>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Task</Table.Th>
							<Table.Th>Start</Table.Th>
							<Table.Th>Stop</Table.Th>
							<Table.Th>Duration</Table.Th>
							<Table.Th w={80}></Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map((entry) => (
							<Table.Tr key={entry.id}>
								<Table.Td fw={500}>{entry.taskName}</Table.Td>
								<Table.Td>{new Date(entry.startTime).toLocaleString()}</Table.Td>
								<Table.Td>
									{entry.stopTime ? new Date(entry.stopTime).toLocaleString() : <Text c='green'>In progress</Text>}
								</Table.Td>
								<Table.Td>
									<TimerControl startTime={entry.stopTime ? null : entry.startTime} duration={entry.duration} />
								</Table.Td>
								<Table.Td>
									<Button variant='light' color='red' size='xs' onClick={() => handleDelete(entry.id)}>
										Delete
									</Button>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.TIME_ENTRIES)({
	component: TimeEntriesPage,
})
