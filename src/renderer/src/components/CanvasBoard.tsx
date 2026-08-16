import { Button, Modal } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	type NodeMouseHandler,
	type OnConnect,
	type OnEdgesChange,
	type OnNodeDrag,
	type OnNodesChange,
	type OnReconnect,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from '@xyflow/react'
import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	useAddCanvasGroup,
	useAddTaskLink,
	useCanvasGroups,
	useDeleteTaskLink,
	useTaskLinks,
	useUpdateCanvasGroup,
	useUpdateCanvasPosition,
	useUpdateTask,
} from '../api'
import { ROUTES } from '../routes'
import type { CanvasGroup, Task } from '../types'
import { CanvasGroupNode, type CanvasGroupNodeType } from './CanvasGroupNode'
import { CanvasTaskNode, type CanvasTaskNodeType } from './CanvasTaskNode'
import { TaskPage } from './TaskPage'

const nodeTypes = { canvasTask: CanvasTaskNode, canvasGroup: CanvasGroupNode }

const UNPLACED_BASE = { x: 100, y: 80 }
const UNPLACED_COL = 280
const UNPLACED_ROW = 140
// New canvas notes always appear at this fixed spot (top-left corner).
const NEW_NOTE_POS = { x: 100, y: 80 }
// New groups are created at a fixed spot; user drags them anywhere.
const NEW_GROUP_POS = { x: 60, y: 60 }

type CanvasNode = CanvasTaskNodeType | CanvasGroupNodeType

// Grouped tasks store canvas coords relative to their group; ungrouped ones store absolute coords.
function buildNodes(tasks: Task[], groups: CanvasGroup[]): CanvasNode[] {
	const groupMap = new Map(groups.map((g) => [g.id, g]))
	let unplaced = 0
	const groupNodes: CanvasGroupNodeType[] = groups.map((g) => ({
		id: `group-${g.id}`,
		type: 'canvasGroup',
		position: { x: g.canvasX ?? NEW_GROUP_POS.x, y: g.canvasY ?? NEW_GROUP_POS.y },
		width: g.width,
		height: g.height,
		data: { group: g },
	}))
	const taskNodes: CanvasTaskNodeType[] = tasks.map((task) => {
		const group = task.groupId != null ? groupMap.get(task.groupId) : undefined
		const hasPos = task.canvasX != null && task.canvasY != null
		const position = hasPos
			? { x: task.canvasX!, y: task.canvasY! }
			: group
				? { x: 10, y: 40 }
				: {
						x: UNPLACED_BASE.x + (unplaced % 6) * UNPLACED_COL,
						y: UNPLACED_BASE.y + Math.floor(unplaced / 6) * UNPLACED_ROW,
					}
		if (!hasPos) unplaced++
		const node: CanvasTaskNodeType = {
			id: `task-${task.id}`,
			type: 'canvasTask',
			position,
			data: { task },
		}
		if (group) {
			node.parentId = `group-${group.id}`
			node.extent = 'parent'
		}
		return node
	})
	return [...groupNodes, ...taskNodes]
}

const taskIdOf = (nodeId: string) => Number(nodeId.replace('task-', ''))
const groupIdOf = (nodeId: string) => Number(nodeId.replace('group-', ''))
const edgeLinkId = (edge: Edge) => Number(edge.id.replace('link-', ''))

// ponytail: O(n*m) AABB intersect, sufficient for typical canvas sizes.
function findGroupAt(nodes: CanvasNode[], node: CanvasNode): CanvasGroupNodeType | null {
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
			return g as CanvasGroupNodeType
		}
	}
	return null
}

function CanvasInner({
	tasks,
	focusGroupId,
	focusTaskId,
}: {
	tasks: Task[]
	focusGroupId?: number
	focusTaskId?: number
}) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { fitView } = useReactFlow()
	const [nodes, setNodes] = useNodesState<CanvasNode>([])
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
	const updateCanvasPosition = useUpdateCanvasPosition()
	const updateTask = useUpdateTask()
	const { data: links } = useTaskLinks()
	const addTaskLink = useAddTaskLink()
	const deleteTaskLink = useDeleteTaskLink()
	const { data: groups } = useCanvasGroups()
	const addCanvasGroup = useAddCanvasGroup()
	const updateCanvasGroup = useUpdateCanvasGroup()

	const [createOpen, setCreateOpen] = useState(false)
	const lastPaneClick = useRef({ time: 0, x: 0, y: 0 })
	// Jump to a group/task node once per mount when navigating with a focus search param
	const focusNodeId =
		focusGroupId != null ? `group-${focusGroupId}` : focusTaskId != null ? `task-${focusTaskId}` : null
	const focusedNode = useRef<string | null>(null)

	useEffect(() => {
		if (!focusNodeId || focusedNode.current === focusNodeId) return
		const node = nodes.find((n) => n.id === focusNodeId)
		if (!node) return
		focusedNode.current = focusNodeId
		fitView({ nodes: [node], duration: 500, maxZoom: 1.5 })
	}, [focusNodeId, nodes, fitView])

	useEffect(() => {
		setNodes(buildNodes(tasks, groups ?? []))
	}, [tasks, groups, setNodes])

	useEffect(() => {
		const nodeIds = new Set(nodes.map((n) => n.id))
		const next = (links ?? [])
			.filter((l) => nodeIds.has(`task-${l.sourceTaskId}`) && nodeIds.has(`task-${l.targetTaskId}`))
			.map((l) => ({
				id: `link-${l.id}`,
				source: `task-${l.sourceTaskId}`,
				target: `task-${l.targetTaskId}`,
			}))
		setEdges(next)
	}, [links, nodes, setEdges])

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
		setNodes((nds) => applyNodeChanges(changes, nds) as CanvasNode[])
		for (const change of changes) {
			if (change.type === 'dimensions' && change.resizing === false && change.id.startsWith('group-')) {
				const dims = change.dimensions
				if (dims) updateCanvasGroup.mutate({ id: groupIdOf(change.id), width: dims.width, height: dims.height })
			}
		}
	}

	const handleNodeDoubleClick: NodeMouseHandler = (_event, node) => {
		if (node.type !== 'canvasTask') return
		navigate({ to: ROUTES.TASK_EDIT, params: { id: String(node.id).replace('task-', '') } })
	}

	const handleNodeDragStop: OnNodeDrag = (_event, node) => {
		if (node.type === 'canvasGroup') {
			updateCanvasGroup.mutate({
				id: groupIdOf(node.id),
				canvasX: node.position.x,
				canvasY: node.position.y,
				width: node.measured?.width ?? node.width,
				height: node.measured?.height ?? node.height,
			})
			return
		}
		const taskId = taskIdOf(node.id)
		const task = tasks.find((t) => t.id === taskId)
		if (!task) return
		if (task.groupId == null) {
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
				updateTask.mutate({ id: taskId, groupId: groupIdOf(groupNode.id), canvasX: rel.x, canvasY: rel.y })
				return
			}
		}
		// ungrouped: absolute coords; grouped: already relative to parent
		updateCanvasPosition.mutate({ id: taskId, x: node.position.x, y: node.position.y })
	}

	const handleConnect: OnConnect = (connection) => {
		if (!connection.source || !connection.target || connection.source === connection.target) return
		addTaskLink.mutate(
			{ sourceTaskId: taskIdOf(connection.source), targetTaskId: taskIdOf(connection.target) },
			{
				onSuccess: (link) => {
					if (link)
						setEdges((eds) => [
							...eds,
							{ id: `link-${link.id}`, source: `task-${link.sourceTaskId}`, target: `task-${link.targetTaskId}` },
						])
				},
			},
		)
	}

	const handleEdgesDelete = (deleted: Edge[]) => {
		deleted.forEach((edge) => deleteTaskLink.mutate(edgeLinkId(edge)))
	}

	const handleReconnect: OnReconnect = (_oldEdge, newConnection) => {
		if (!newConnection.source || !newConnection.target || newConnection.source === newConnection.target) return
		const old = edges.find((e) => e.id === _oldEdge.id)
		if (!old) return
		deleteTaskLink.mutate(edgeLinkId(old))
		addTaskLink.mutate({
			sourceTaskId: taskIdOf(newConnection.source),
			targetTaskId: taskIdOf(newConnection.target),
		})
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
				onConnect={handleConnect}
				onEdgesDelete={handleEdgesDelete}
				onReconnect={handleReconnect}
				deleteKeyCode={['Backspace', 'Delete']}
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
						addCanvasGroup.mutate({ name: t('tasks.newGroup'), canvasX: NEW_GROUP_POS.x, canvasY: NEW_GROUP_POS.y })
					}
				>
					{t('tasks.newGroup')}
				</Button>
				<Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
					{t('tasks.newCanvasTask')}
				</Button>
			</div>

			<Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('tasks.newTitle')} size='xl' centered>
				<TaskPage
					mode='create'
					initialEntityType='note'
					onCancel={() => setCreateOpen(false)}
					onCreated={(task) => {
						updateCanvasPosition.mutate({ id: task.id, x: NEW_NOTE_POS.x, y: NEW_NOTE_POS.y })
						setCreateOpen(false)
					}}
				/>
			</Modal>
		</div>
	)
}

export function CanvasBoard({
	tasks,
	focusGroupId,
	focusTaskId,
}: {
	tasks: Task[]
	focusGroupId?: number
	focusTaskId?: number
}) {
	return (
		<ReactFlowProvider>
			<CanvasInner tasks={tasks} focusGroupId={focusGroupId} focusTaskId={focusTaskId} />
		</ReactFlowProvider>
	)
}
