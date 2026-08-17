import { Button, Modal } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	MarkerType,
	type NodeMouseHandler,
	type OnEdgesChange,
	type OnNodeDrag,
	type OnNodesChange,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from '@xyflow/react'
import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddGroup, useGroups, useUpdateCanvasPosition, useUpdateGroup, useUpdateItem } from '../api'
import { ROUTES } from '../routes'
import type { Group, Item } from '../types'
import { CanvasItemNode, type CanvasItemNodeType } from './CanvasItemNode'
import { GroupNode, type GroupNodeType } from './GroupNode'
import { ItemPage } from './ItemPage'

const nodeTypes = { canvasItem: CanvasItemNode, canvasGroup: GroupNode }

const UNPLACED_BASE = { x: 100, y: 80 }
const UNPLACED_COL = 280
const UNPLACED_ROW = 140
// New canvas notes always appear at this fixed spot (top-left corner).
const NEW_NOTE_POS = { x: 100, y: 80 }
// New groups are created at a fixed spot; user drags them anywhere.
const NEW_GROUP_POS = { x: 60, y: 60 }

type CanvasNode = CanvasItemNodeType | GroupNodeType

// Grouped items store canvas coords relative to their group; ungrouped ones store absolute coords.
function buildNodes(items: Item[], groups: Group[]): CanvasNode[] {
	const groupMap = new Map(groups.map((g) => [g.id, g]))
	let unplaced = 0
	const groupNodes: GroupNodeType[] = groups.map((g) => ({
		id: `group-${g.id}`,
		type: 'canvasGroup',
		position: { x: g.canvasX ?? NEW_GROUP_POS.x, y: g.canvasY ?? NEW_GROUP_POS.y },
		width: g.width,
		height: g.height,
		data: { group: g },
	}))
	const itemNodes: CanvasItemNodeType[] = items.map((item) => {
		const group = item.groupId != null ? groupMap.get(item.groupId) : undefined
		const hasPos = item.canvasX != null && item.canvasY != null
		const position = hasPos
			? { x: item.canvasX!, y: item.canvasY! }
			: group
				? { x: 10, y: 40 }
				: {
						x: UNPLACED_BASE.x + (unplaced % 6) * UNPLACED_COL,
						y: UNPLACED_BASE.y + Math.floor(unplaced / 6) * UNPLACED_ROW,
					}
		if (!hasPos) unplaced++
		const node: CanvasItemNodeType = {
			id: `item-${item.id}`,
			type: 'canvasItem',
			position,
			width: item.canvasWidth ?? 260,
			height: item.canvasHeight ?? 200,
			data: { item },
		}
		if (group) {
			node.parentId = `group-${group.id}`
			node.extent = 'parent'
		}
		return node
	})
	return [...groupNodes, ...itemNodes]
}

const itemIdOf = (nodeId: string) => Number(nodeId.replace('item-', ''))
const groupIdOf = (nodeId: string) => Number(nodeId.replace('group-', ''))

function buildEdges(items: Item[]): Edge[] {
	const itemIds = new Set(items.map((item) => item.id))
	return items.flatMap((item) =>
		item.parentId != null && itemIds.has(item.parentId)
			? [
					{
						id: `parent-${item.parentId}-${item.id}`,
						source: `item-${item.parentId}`,
						target: `item-${item.id}`,
						type: 'smoothstep',
						markerEnd: { type: MarkerType.ArrowClosed },
						style: { stroke: 'var(--mantine-color-blue-6)', strokeWidth: 2 },
						deletable: false,
						reconnectable: false,
					},
				]
			: [],
	)
}

// ponytail: O(n*m) AABB intersect, sufficient for typical canvas sizes.
function findGroupAt(nodes: CanvasNode[], node: CanvasNode): GroupNodeType | null {
	const w = node.measured?.width ?? 0
	const h = node.measured?.height ?? 0
	for (const g of nodes) {
		if (g.type !== 'canvasGroup') continue
		const gw = g.measured?.width ?? g.width ?? 0
		const gh = g.measured?.height ?? g.height ?? 0
		if (
			node.position.x < g.position.x + gw &&
			node.position.x + w > g.position.x &&
			node.position.y < g.position.y + gh &&
			node.position.y + h > g.position.y
		) {
			return g as GroupNodeType
		}
	}
	return null
}

function CanvasInner({
	items,
	focusGroupId,
	focusItemId,
}: {
	items: Item[]
	focusGroupId?: number
	focusItemId?: number
}) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { fitView } = useReactFlow()
	const [nodes, setNodes] = useNodesState<CanvasNode>([])
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
	const updateCanvasPosition = useUpdateCanvasPosition()
	const updateItem = useUpdateItem()
	const { data: groups } = useGroups()
	const addGroup = useAddGroup()
	const updateGroup = useUpdateGroup()

	const [createOpen, setCreateOpen] = useState(false)
	const lastPaneClick = useRef({ time: 0, x: 0, y: 0 })
	// Jump to a group/item node once per mount when navigating with a focus search param
	const focusNodeId =
		focusGroupId != null ? `group-${focusGroupId}` : focusItemId != null ? `item-${focusItemId}` : null
	const focusedNode = useRef<string | null>(null)

	useEffect(() => {
		if (!focusNodeId || focusedNode.current === focusNodeId) return
		const node = nodes.find((n) => n.id === focusNodeId)
		if (!node) return
		focusedNode.current = focusNodeId
		fitView({ nodes: [node], duration: 500, maxZoom: 1.5 })
	}, [focusNodeId, nodes, fitView])

	useEffect(() => {
		setNodes(buildNodes(items, groups ?? []))
	}, [items, groups, setNodes])

	useEffect(() => {
		setEdges(buildEdges(items))
	}, [items, setEdges])

	const openCreateModal = () => {
		setCreateOpen(true)
	}

	const handlePaneClick = (event: ReactMouseEvent) => {
		const now = Date.now()
		const prev = lastPaneClick.current
		const isDouble =
			now - prev.time < 350 && Math.abs(event.clientX - prev.x) < 8 && Math.abs(event.clientY - prev.y) < 8
		lastPaneClick.current = { time: now, x: event.clientX, y: event.clientY }
		if (isDouble) {
			openCreateModal()
		}
	}

	const handleNodesChange: OnNodesChange = (changes) => {
		const next = applyNodeChanges(changes, nodes) as CanvasNode[]
		setNodes(next)
		for (const change of changes) {
			if (change.type === 'dimensions' && change.resizing === false) {
				const dims = change.dimensions
				const node = next.find((n) => n.id === change.id)
				if (!dims || !node) continue
				if (change.id.startsWith('group-')) {
					updateGroup.mutate({
						id: groupIdOf(change.id),
						canvasX: node.position.x,
						canvasY: node.position.y,
						width: dims.width,
						height: dims.height,
					})
				} else if (change.id.startsWith('item-')) {
					updateItem.mutate({
						id: itemIdOf(change.id),
						canvasX: node.position.x,
						canvasY: node.position.y,
						canvasWidth: dims.width,
						canvasHeight: dims.height,
					})
				}
			}
		}
	}

	const handleNodeDoubleClick: NodeMouseHandler = (_event, node) => {
		if (node.type !== 'canvasItem') return
		navigate({ to: ROUTES.ITEM_EDIT, params: { id: String(node.id).replace('item-', '') } })
	}

	const handleNodeDragStop: OnNodeDrag = (_event, node) => {
		if (node.type === 'canvasGroup') {
			updateGroup.mutate({
				id: groupIdOf(node.id),
				canvasX: node.position.x,
				canvasY: node.position.y,
				width: node.measured?.width ?? node.width,
				height: node.measured?.height ?? node.height,
			})
			return
		}
		const itemId = itemIdOf(node.id)
		const item = items.find((t) => t.id === itemId)
		if (!item) return
		if (item.groupId == null) {
			const groupNode = findGroupAt(nodes, node as CanvasNode)
			if (groupNode) {
				const rel = {
					x: node.position.x - groupNode.position.x,
					y: node.position.y - groupNode.position.y,
				}
				setNodes((nds) =>
					nds.map((n) =>
						n.id === node.id ? { ...n, parentId: groupNode.id, extent: 'parent' as const, position: rel } : n,
					),
				)
				// grouped coords are stored relative to the group; single mutation to avoid inconsistent intermediate rebuild
				updateItem.mutate({ id: itemId, groupId: groupIdOf(groupNode.id), canvasX: rel.x, canvasY: rel.y })
				return
			}
		}
		// ungrouped: absolute coords; grouped: already relative to parent
		updateCanvasPosition.mutate({ id: itemId, x: node.position.x, y: node.position.y })
	}

	return (
		<div
			style={{
				height: 'calc(100vh - 270px)',
				position: 'relative',
				border: '1px solid var(--mantine-color-default-border)',
				borderRadius: 12,
				overflow: 'hidden',
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={handleNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				onPaneClick={handlePaneClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onNodeDragStop={handleNodeDragStop}
				zoomOnDoubleClick={false}
				fitView
				minZoom={0.1}
				maxZoom={2}
				proOptions={{ hideAttribution: true }}
			>
				<Background variant={BackgroundVariant.Dots} gap={24} size={1.5} />
				<Controls position='bottom-left' />
			</ReactFlow>

			<div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 8 }}>
				<Button
					variant='default'
					leftSection={<IconPlus size={16} />}
					onClick={() =>
						addGroup.mutate({ name: t('items.newGroup'), canvasX: NEW_GROUP_POS.x, canvasY: NEW_GROUP_POS.y })
					}
				>
					{t('items.newGroup')}
				</Button>
				<Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
					{t('items.newCanvasItem')}
				</Button>
			</div>

			<Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('items.newTitle')} size='xl' centered>
				<ItemPage
					mode='create'
					initialEntityType='note'
					onCancel={() => setCreateOpen(false)}
					onCreated={(item) => {
						updateCanvasPosition.mutate({ id: item.id, x: NEW_NOTE_POS.x, y: NEW_NOTE_POS.y })
						setCreateOpen(false)
					}}
				/>
			</Modal>
		</div>
	)
}

export function CanvasBoard({
	items,
	focusGroupId,
	focusItemId,
}: {
	items: Item[]
	focusGroupId?: number
	focusItemId?: number
}) {
	return (
		<ReactFlowProvider>
			<CanvasInner items={items} focusGroupId={focusGroupId} focusItemId={focusItemId} />
		</ReactFlowProvider>
	)
}
