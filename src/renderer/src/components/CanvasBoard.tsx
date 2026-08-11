import { Button, Modal } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import {
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	type NodeMouseHandler,
	type OnConnect,
	type OnEdgesChange,
	type OnNodeDrag,
	type OnReconnect,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
} from '@xyflow/react'
import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddTaskLink, useDeleteTaskLink, useTaskLinks, useUpdateCanvasPosition } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'
import { CanvasTaskNode, type CanvasTaskNodeType } from './CanvasTaskNode'
import { TaskPage } from './TaskPage'

const nodeTypes = { canvasTask: CanvasTaskNode }

const UNPLACED_BASE = { x: 100, y: 80 }
const UNPLACED_COL = 280
const UNPLACED_ROW = 140
// New canvas notes always appear at this fixed spot (top-left corner).
const NEW_NOTE_POS = { x: 100, y: 80 }

function buildNodes(tasks: Task[]): CanvasTaskNodeType[] {
	let unplaced = 0
	return tasks.map((task) => {
		const hasPos = task.canvasX != null && task.canvasY != null
		const position = hasPos
			? { x: task.canvasX!, y: task.canvasY! }
			: {
					x: UNPLACED_BASE.x + (unplaced % 6) * UNPLACED_COL,
					y: UNPLACED_BASE.y + Math.floor(unplaced / 6) * UNPLACED_ROW,
				}
		if (!hasPos) unplaced++
		return { id: `task-${task.id}`, type: 'canvasTask', position, data: { task } }
	})
}

const taskIdOf = (nodeId: string) => Number(nodeId.replace('task-', ''))
const edgeLinkId = (edge: Edge) => Number(edge.id.replace('link-', ''))

function CanvasInner({ tasks }: { tasks: Task[] }) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const [nodes, setNodes, onNodesChange] = useNodesState<CanvasTaskNodeType>([])
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
	const updateCanvasPosition = useUpdateCanvasPosition()
	const { data: links } = useTaskLinks()
	const addTaskLink = useAddTaskLink()
	const deleteTaskLink = useDeleteTaskLink()

	const [createOpen, setCreateOpen] = useState(false)
	const lastPaneClick = useRef({ time: 0, x: 0, y: 0 })

	useEffect(() => {
		setNodes(buildNodes(tasks))
	}, [tasks, setNodes])

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

	const handleNodeDoubleClick: NodeMouseHandler = (_event, node) => {
		navigate({ to: ROUTES.TASK_EDIT, params: { id: String(node.id).replace('task-', '') } })
	}

	const handleNodeDragStop: OnNodeDrag = (_event, node) => {
		updateCanvasPosition.mutate({
			id: taskIdOf(node.id),
			x: node.position.x,
			y: node.position.y,
		})
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
				onNodesChange={onNodesChange}
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

			<Button
				leftSection={<IconPlus size={16} />}
				onClick={openCreateModal}
				style={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}
			>
				{t('tasks.newCanvasTask')}
			</Button>

			<Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('tasks.newTitle')} size='xl' centered>
				<TaskPage
					mode='create'
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

export function CanvasBoard({ tasks }: { tasks: Task[] }) {
	return (
		<ReactFlowProvider>
			<CanvasInner tasks={tasks} />
		</ReactFlowProvider>
	)
}
