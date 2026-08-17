import { ActionIcon, Card, Collapse, Group, Table, Text } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteTimeEntry } from '../api'
import { formatDuration } from '../hooks/useTimer'
import type { TimeEntryWithItem } from '../types'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { TimerControl } from './TimerControl'

interface ItemTimeEntriesProps {
	itemName: string
	entries: TimeEntryWithItem[]
	expanded?: boolean
	onToggle?: () => void
	defaultOpen?: boolean
}

export function ItemTimeEntries({ itemName, entries, expanded, onToggle, defaultOpen = false }: ItemTimeEntriesProps) {
	const { t } = useTranslation()
	const deleteTimeEntry = useDeleteTimeEntry()
	const [internalOpen, setInternalOpen] = useState(defaultOpen)

	const isControlled = expanded !== undefined
	const open = isControlled ? expanded : internalOpen
	const toggle = () => (isControlled ? onToggle?.() : setInternalOpen((v) => !v))
	const total = entries.reduce((acc, e) => acc + (e.duration ?? 0), 0)

	return (
		<Card withBorder radius='md' padding='sm'>
			<Group wrap='nowrap' justify='space-between' onClick={toggle} style={{ cursor: 'pointer' }}>
				<Group wrap='nowrap' gap={8}>
					<ActionIcon variant='subtle' color='gray' size='sm'>
						<IconChevronDown
							size={14}
							style={{
								transform: open ? 'rotate(180deg)' : undefined,
								transition: 'transform 150ms',
							}}
						/>
					</ActionIcon>
					<Text fw={500}>{itemName}</Text>
				</Group>
				<Group wrap='nowrap' gap='md'>
					<Text fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
						{formatDuration(total)}
					</Text>
				</Group>
			</Group>
			<Collapse expanded={open} mt='xs'>
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>{t('timeEntries.start')}</Table.Th>
							<Table.Th>{t('timeEntries.stop')}</Table.Th>
							<Table.Th>{t('timeEntries.duration')}</Table.Th>
							<Table.Th w={80}></Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map((entry) => (
							<Table.Tr key={entry.id}>
								<Table.Td>{new Date(entry.startTime).toLocaleString()}</Table.Td>
								<Table.Td>
									{entry.stopTime ? (
										new Date(entry.stopTime).toLocaleString()
									) : (
										<Text c='green'>{t('timeEntries.inProgress')}</Text>
									)}
								</Table.Td>
								<Table.Td>
									<TimerControl
										itemId={entry.itemId}
										duration={entry.duration}
										startTime={entry.stopTime ? null : entry.startTime}
										isActiveEntry={entry.stopTime === null}
									/>
								</Table.Td>
								<Table.Td>
									<ConfirmDeleteButton
										size='xs'
										loading={deleteTimeEntry.isPending}
										onConfirm={() => deleteTimeEntry.mutate(entry.id)}
									/>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Collapse>
		</Card>
	)
}
