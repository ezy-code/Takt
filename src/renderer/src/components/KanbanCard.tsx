import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import type { Item } from '../types'
import { ItemCard } from './ItemCard'

interface KanbanCardProps {
	item: Item
}

export const KanbanCard = memo(function KanbanCard({ item }: KanbanCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `item-${item.id}`,
		data: { type: 'item', item },
	})

	const style: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.2 : 1,
		userSelect: 'none',
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<ItemCard item={item} />
		</div>
	)
})
