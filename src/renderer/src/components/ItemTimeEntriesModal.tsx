import { Modal } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useTimeEntries } from '../api'
import type { Item } from '../types'
import { ItemTimeEntries } from './ItemTimeEntries'

interface ItemTimeEntriesModalProps {
	item: Item
	onClose: () => void
}

export function ItemTimeEntriesModal({ item, onClose }: ItemTimeEntriesModalProps) {
	const { t } = useTranslation()
	const { data: entries = [] } = useTimeEntries()

	const itemEntries = entries
		.filter((e) => e.itemId === item.id)
		.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

	return (
		<Modal opened onClose={onClose} title={t('timeEntries.title')} size='lg'>
			<ItemTimeEntries itemName={item.name} entries={itemEntries} defaultOpen />
		</Modal>
	)
}
