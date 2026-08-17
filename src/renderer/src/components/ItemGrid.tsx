import { SimpleGrid } from '@mantine/core'
import type { Item } from '../types'
import { ItemCard } from './ItemCard'

interface ItemGridProps {
	items: Item[]
}

export function ItemGrid({ items }: ItemGridProps) {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
			{items.map((item) => (
				<ItemCard key={item.id} item={item} />
			))}
		</SimpleGrid>
	)
}
