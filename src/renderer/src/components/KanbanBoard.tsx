import {
	type CollisionDetection,
	closestCorners,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	TouchSensor,
	type UniqueIdentifier,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { Group, Loader, ScrollArea, Text } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useItems, useMoveItem, useReorderItems, useReorderStatuses, useStatuses } from '../api'
import type { Item, Status } from '../types'
import { AddStatusColumn } from './AddStatusColumn'
import { ItemCard } from './ItemCard'
import { KanbanColumn } from './KanbanColumn'

export function KanbanBoard() {
	const { t } = useTranslation()
	const [activeItem, setActiveItem] = useState<Item | null>(null)
	const [activeColumn, setActiveColumn] = useState<Status | null>(null)
	const [localStatuses, setLocalStatuses] = useState<Status[]>([])
	const [columnItems, setColumnItems] = useState<Record<number, Item[]>>({})

	const { data: items, isLoading: itemsLoading } = useItems()
	const { data: statuses, isLoading: statusesLoading } = useStatuses()
	const moveItem = useMoveItem()
	const reorderStatuses = useReorderStatuses()
	const reorderItems = useReorderItems()

	const dragOrigin = useRef<{ itemId: number; statusId: number | null } | null>(null)
	const isDraggingRef = useRef(false)
	isDraggingRef.current = activeItem != null

	useEffect(() => {
		if (statuses) setLocalStatuses(statuses)
	}, [statuses])

	useEffect(() => {
		if (isDraggingRef.current) return
		if (!statuses || !items) return

		const grouped: Record<number, Item[]> = {}
		for (const s of statuses) {
			grouped[s.id] = (items ?? []).filter((t) => (t.statusId ?? null) === s.id)
		}
		setColumnItems(grouped)
	}, [statuses, items])

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
		useSensor(KeyboardSensor),
	)

	const findContainer = useCallback(
		(id: UniqueIdentifier): number | null => {
			const idStr = String(id)

			if (idStr.startsWith('column-')) {
				return Number(idStr.replace('column-', ''))
			}

			for (const [statusId, itemList] of Object.entries(columnItems)) {
				if (itemList.some((t) => `item-${t.id}` === idStr)) {
					return Number(statusId)
				}
			}

			return null
		},
		[columnItems],
	)

	const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
		if (args.active.data.current?.type === 'column') {
			return closestCorners(args)
		}

		const pointerCollisions = pointerWithin(args)
		if (pointerCollisions.length > 0) {
			return pointerCollisions
		}

		return closestCorners(args)
	}, [])

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event
		const data = active.data.current

		if (data?.type === 'item') {
			const item = data.item as Item
			setActiveItem(item)
			dragOrigin.current = { itemId: item.id, statusId: item.statusId ?? null }
		} else if (data?.type === 'column') {
			setActiveColumn(data.status as Status)
		}
	}

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event
		if (!over) return

		const activeId = active.id
		const overId = over.id
		if (activeId === overId) return

		const activeData = active.data.current
		const overData = over.data.current
		if (activeData?.type !== 'item') return

		const activeContainer = findContainer(activeId)
		const overContainer =
			overData?.type === 'column' ? (overData.statusId ?? overData.status?.id) : findContainer(overId)

		if (!activeContainer || !overContainer) return

		if (activeContainer !== overContainer) {
			setColumnItems((prev) => {
				const activeItems = prev[activeContainer] ?? []
				const overItems = prev[overContainer] ?? []

				const activeIndex = activeItems.findIndex((t) => `item-${t.id}` === activeId)
				if (activeIndex === -1) return prev

				const itemToMove = activeItems[activeIndex]
				const updatedItem = { ...itemToMove, statusId: overContainer }

				let overIndex =
					overData?.type === 'item' ? overItems.findIndex((t) => `item-${t.id}` === overId) : overItems.length

				if (overIndex === -1) overIndex = overItems.length

				return {
					...prev,
					[activeContainer]: activeItems.filter((t) => `item-${t.id}` !== activeId),
					[overContainer]: [...overItems.slice(0, overIndex), updatedItem, ...overItems.slice(overIndex)],
				}
			})
		} else if (overData?.type === 'item') {
			setColumnItems((prev) => {
				const items = prev[activeContainer] ?? []
				const oldIndex = items.findIndex((t) => `item-${t.id}` === activeId)
				const newIndex = items.findIndex((t) => `item-${t.id}` === overId)

				if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
					return {
						...prev,
						[activeContainer]: arrayMove(items, oldIndex, newIndex),
					}
				}
				return prev
			})
		}
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		const item = activeItem
		const column = activeColumn
		const origin = dragOrigin.current

		setActiveItem(null)
		setActiveColumn(null)
		dragOrigin.current = null

		if (!over) return

		if (column) {
			if (active.id === over.id) return
			const oldIndex = localStatuses.findIndex((s) => `column-${s.id}` === active.id)
			const newIndex = localStatuses.findIndex((s) => `column-${s.id}` === over.id)
			if (oldIndex !== -1 && newIndex !== -1) {
				const reordered = arrayMove(localStatuses, oldIndex, newIndex)
				setLocalStatuses(reordered)
				reorderStatuses.mutate(reordered.map((s) => s.id))
			}
			return
		}

		if (item && origin) {
			const finalContainer = findContainer(`item-${item.id}`)
			if (finalContainer == null) return

			const finalItems = columnItems[finalContainer] ?? []

			if (origin.statusId === finalContainer) {
				reorderItems.mutate({ columnId: finalContainer, itemIds: finalItems.map((t) => t.id) })
			} else {
				moveItem.mutate({ itemId: item.id, statusId: finalContainer })
				reorderItems.mutate({ columnId: finalContainer, itemIds: finalItems.map((t) => t.id) })
			}
		}
	}

	if (itemsLoading || statusesLoading) {
		return <Loader mt='xl' />
	}

	if (!statuses || statuses.length === 0) {
		return (
			<Text c='dimmed' mt='xl'>
				{t('kanban.noStatuses')}
			</Text>
		)
	}

	return (
		<ScrollArea style={{ height: 'calc(100vh - 270px)' }}>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetectionStrategy}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={() => {
					setActiveItem(null)
					setActiveColumn(null)
					dragOrigin.current = null
				}}
			>
				<Group wrap='nowrap' align='stretch' gap='md'>
					<SortableContext items={localStatuses.map((s) => `column-${s.id}`)} strategy={horizontalListSortingStrategy}>
						{localStatuses.map((status) => (
							<KanbanColumn key={status.id} status={status} items={columnItems[status.id] ?? []} />
						))}
					</SortableContext>
					<AddStatusColumn />
				</Group>

				<DragOverlay dropAnimation={null}>
					{activeItem ? (
						<div style={{ transform: 'rotate(2deg)', cursor: 'grabbing' }}>
							<ItemCard item={activeItem} />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</ScrollArea>
	)
}
