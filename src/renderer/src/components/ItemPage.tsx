import type { ExtensiveEditorRef } from '@lyfie/luthor'
import type { TreeNodeData } from '@mantine/core'
import {
	Box,
	Button,
	Container,
	Group,
	Modal,
	NumberInput,
	Popover,
	SegmentedControl,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
	TreeSelect,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
	IconArrowLeft,
	IconClock,
	IconCoin,
	IconEdit,
	IconFolder,
	IconPlus,
	IconTrash,
	IconX,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EMPTY_DESCRIPTION } from '../../../shared/constants'
import { useAddItem, useDeleteItem, useGroups, useItem, useItems, useStatuses, useUpdateItem } from '../api'
import { ROUTES } from '../routes'
import { lastItemsTab } from '../store/lastItemsTab'
import type { EntityType, Group as GroupModel, Item } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'
import { EntityHierarchy } from './EntityHierarchy'
import { EntityTypeBadge } from './EntityTypeBadge'
import { ItemCostPill } from './ItemCostPill'
import { ItemTimeEntriesModal } from './ItemTimeEntriesModal'
import { MarkdownPreview } from './MarkdownPreview'
import { MyDayControl } from './MyDayControl'
import { PropertyPill } from './PropertyPill'
import { RichTextEditor } from './RichTextEditor'
import { StatusBadge } from './StatusBadge'
import { TimerControl } from './TimerControl'

function isDescendant(entities: Item[], entityId: number | undefined, candidateParentId: number) {
	if (entityId == null) return false
	const byId = new Map(entities.map((entity) => [entity.id, entity]))
	let currentId: number | null = candidateParentId
	const visited = new Set<number>()
	while (currentId != null && !visited.has(currentId)) {
		visited.add(currentId)
		if (currentId === entityId) return true
		currentId = byId.get(currentId)?.parentId ?? null
	}
	return false
}

interface ItemPageProps {
	id?: number
	mode: 'view' | 'edit'
	onCancel?: () => void
	isModal?: boolean
}

interface ItemSnapshot {
	name: string
	statusId: number | null
	parentId: number | null
	groupId: number | null
	addToMyDay: boolean
	reminderAt: string | null
	description: string
	hourlyRate: number | null
	entityType: EntityType
}

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'error'

const FIELD_TEXT_STYLE = {
	fontSize: 'var(--mantine-font-size-sm)',
	fontWeight: 'normal',
	color: 'var(--mantine-color-text)',
	padding: 0,
	height: 'auto',
	minHeight: 'auto',
	cursor: 'pointer',
} as const

const SAVE_STATUS_STYLE = {
	saving: { color: 'var(--mantine-color-blue-6)', label: 'saveStatus.saving' },
	dirty: { color: 'var(--mantine-color-yellow-6)', label: 'saveStatus.saving' },
	error: { color: 'var(--mantine-color-red-6)', label: 'saveStatus.saveFailed' },
	idle: { color: 'var(--mantine-color-green-6)', label: 'saveStatus.saved' },
} as const

function SaveStatusDot({ status, onRetry }: { status: SaveStatus; onRetry?: () => void }) {
	const { t } = useTranslation()
	const style = SAVE_STATUS_STYLE[status]
	return (
		<Tooltip label={t(style.label)}>
			<Box
				onClick={onRetry}
				style={{
					width: 8,
					height: 8,
					borderRadius: '50%',
					background: style.color,
					cursor: status === 'error' ? 'pointer' : 'default',
					animation: status === 'dirty' ? 'takt-pulse 1.2s ease-in-out infinite' : undefined,
				}}
			/>
		</Tooltip>
	)
}

export function ItemPage({ id, mode, onCancel, isModal }: ItemPageProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const editable = mode !== 'view'
	const isEdit = mode === 'edit'
	const [editorReady, setEditorReady] = useState(false)

	const { data: item, isLoading } = useItem(id ?? 0)
	const { data: statuses } = useStatuses()
	const { data: entities = [] } = useItems()
	const { data: groups = [] } = useGroups()
	const addItem = useAddItem()
	const updateItem = useUpdateItem()
	const deleteItem = useDeleteItem()

	const [name, setName] = useState('')
	const [statusId, setStatusId] = useState<number | null>(null)
	const [parentId, setParentId] = useState<number | null>(null)
	const [groupId, setGroupId] = useState<number | null>(null)
	const [addToMyDay, setAddToMyDay] = useState(false)
	const [reminderAt, setReminderAt] = useState<string | null>(null)
	const [hourlyRate, setHourlyRate] = useState<number | string>('')
	const [entityType, setEntityType] = useState<EntityType>('task')
	const entityLabel = t(`entity.${entityType}`)
	const [showTimeEntries, setShowTimeEntries] = useState(false)
	const [createChildOpen, setCreateChildOpen] = useState(false)
	const [addChildMode, setAddChildMode] = useState<'create' | 'attach'>('create')
	const [childId, setChildId] = useState<number | null>(null)
	const [attachChildId, setAttachChildId] = useState<string | null>(null)
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('items.deleteTitle'),
		message: t('items.deleteBody'),
	})

	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const [descriptionRev, setDescriptionRev] = useState(0)
	const [hydrated, setHydrated] = useState(false)
	const [baselineSet, setBaselineSet] = useState(false)
	const saveRef = useRef<ItemSnapshot | null>(null)
	const injectedRef = useRef(false)
	const lastDescRef = useRef('')
	const inFlightRef = useRef(false)
	const pendingRef = useRef(false)

	const groupTree = useMemo<TreeNodeData[]>(() => {
		const byParent = new Map<number | null, GroupModel[]>()
		for (const g of groups) byParent.set(g.parentId ?? null, [...(byParent.get(g.parentId ?? null) ?? []), g])
		const build = (parentId: number | null): TreeNodeData[] =>
			(byParent.get(parentId) ?? []).map((g) => ({
				value: String(g.id),
				label: g.name,
				children: build(g.id),
			}))
		return build(null)
	}, [groups])

	const currentGroupId = mode === 'view' ? (item?.groupId ?? null) : groupId
	const groupChain = useMemo(() => {
		const byId = new Map(groups.map((g) => [g.id, g]))
		const names: string[] = []
		let cur = currentGroupId != null ? byId.get(currentGroupId) : undefined
		while (cur) {
			names.unshift(cur.name)
			cur = cur.parentId != null ? byId.get(cur.parentId) : undefined
		}
		return names.join(' - ')
	}, [groups, currentGroupId])

	useEffect(() => {
		setHydrated(false)
		setBaselineSet(false)
		injectedRef.current = false
		setSaveStatus('idle')
		setDescriptionRev(0)
		setName('')
		setEntityType('task')
		setStatusId(null)
		setParentId(null)
		setGroupId(null)
		setAddToMyDay(false)
		setReminderAt(null)
		setHourlyRate('')
	}, [id])

	useEffect(() => {
		if (!isEdit || !item || hydrated) return
		setHydrated(true)
		setName(item.name)
		setEntityType(item.entityType ?? 'task')
		setStatusId(item.entityType === 'task' ? (item.statusId ?? null) : null)
		setParentId(item.parentId ?? null)
		setGroupId(item.groupId ?? null)
		setAddToMyDay(!!item.myDayDate)
		setReminderAt(item.reminderAt ? dayjs(item.reminderAt).format('YYYY-MM-DD HH:mm:ss') : null)
		setHourlyRate(item.hourlyRate ?? '')
	}, [isEdit, item, hydrated])

	useEffect(() => {
		if (!isEdit || !hydrated || !editorReady || injectedRef.current) return
		injectedRef.current = true
		editorRef.current?.injectJSON(item?.description ?? '')
		lastDescRef.current = editorRef.current?.getJSON() ?? ''
	}, [isEdit, hydrated, editorReady, item])

	const currentValues = useCallback((): ItemSnapshot => {
		return {
			name,
			statusId,
			parentId,
			groupId,
			addToMyDay,
			reminderAt,
			description: editorRef.current?.getJSON() ?? '',
			hourlyRate: hourlyRate === '' ? null : Number(hourlyRate),
			entityType,
		}
	}, [name, statusId, parentId, groupId, addToMyDay, reminderAt, hourlyRate, entityType])

	useEffect(() => {
		if (!editable) return
		if (isEdit && (!hydrated || !editorReady)) return
		if (baselineSet) return
		setBaselineSet(true)
		saveRef.current = currentValues()
	}, [editable, isEdit, hydrated, editorReady, baselineSet, currentValues])

	useEffect(() => {
		if (!editable || !editorReady) return
		const timer = setInterval(() => {
			const cur = editorRef.current?.getJSON() ?? ''
			if (cur !== lastDescRef.current) {
				lastDescRef.current = cur
				setDescriptionRev((r) => r + 1)
			}
		}, 300)
		return () => clearInterval(timer)
	}, [editable, editorReady])

	const isDirty = useCallback(() => {
		const s = saveRef.current
		if (!s) return false
		const cur = currentValues()
		return (
			cur.name !== s.name ||
			cur.statusId !== s.statusId ||
			cur.parentId !== s.parentId ||
			cur.groupId !== s.groupId ||
			cur.addToMyDay !== s.addToMyDay ||
			cur.reminderAt !== s.reminderAt ||
			cur.hourlyRate !== s.hourlyRate ||
			cur.entityType !== s.entityType ||
			cur.description !== s.description
		)
	}, [currentValues])

	const payloadFromSnapshot = useCallback(
		(s: ItemSnapshot) => ({
			name: s.name,
			description: s.description,
			descriptionMd: editorRef.current?.getMarkdown() ?? '',
			descriptionHtml: editorRef.current?.getHTML() ?? '',
			statusId: s.entityType === 'task' ? s.statusId : null,
			parentId: s.parentId ?? null,
			groupId: s.groupId ?? null,
			myDay: s.addToMyDay,
			reminderAt: s.reminderAt ? new Date(s.reminderAt).toISOString() : null,
			hourlyRate: s.hourlyRate,
			entityType: s.entityType,
		}),
		[],
	)

	const runAutosave = useCallback(async () => {
		if (!id) return
		if (inFlightRef.current) {
			pendingRef.current = true
			return
		}
		if (!isDirty()) return
		inFlightRef.current = true
		setSaveStatus('saving')
		const snapshot = currentValues()
		try {
			await updateItem.mutateAsync({ id, ...payloadFromSnapshot(snapshot) })
			saveRef.current = snapshot
			setSaveStatus('idle')
		} catch {
			setSaveStatus('error')
		} finally {
			inFlightRef.current = false
			if (pendingRef.current) {
				pendingRef.current = false
				void runAutosave()
			} else {
				setSaveStatus(isDirty() ? 'dirty' : 'idle')
			}
		}
	}, [id, updateItem, isDirty, currentValues, payloadFromSnapshot])

	useEffect(() => {
		if (!editable || !baselineSet) return
		if (!isDirty()) return
		setSaveStatus('dirty')
		const timer = setTimeout(() => {
			void runAutosave()
		}, 500)
		return () => clearTimeout(timer)
	}, [
		name,
		statusId,
		parentId,
		groupId,
		addToMyDay,
		reminderAt,
		hourlyRate,
		entityType,
		descriptionRev,
		editable,
		baselineSet,
		isDirty,
		runAutosave,
	])

	if (isLoading)
		return (
			<Container fluid py='md'>
				<Text c='dimmed'>{t('common.loading')}</Text>
			</Container>
		)
	if (!item)
		return (
			<Container fluid py='md'>
				<Text c='red'>{t('items.notFound')}</Text>
			</Container>
		)

	const status = statuses?.find((s) => s.id === (mode === 'view' ? item?.statusId : statusId))
	const displayedEntityType = mode === 'view' ? (item?.entityType ?? 'task') : entityType
	const isPast = item?.reminderAt != null && new Date(item.reminderAt).getTime() < Date.now()

	const parentOptions = entities
		.filter((entity) => entity.id !== item?.id && !isDescendant(entities, item?.id, entity.id))
		.map((entity) => ({
			value: String(entity.id),
			label: `${entity.name} · ${t(`entity.${entity.entityType ?? 'task'}`)}`,
		}))

	const goBack = () => {
		if (onCancel) onCancel()
		else if (isEdit) navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(id) } })
		else navigate({ to: ROUTES.ITEMS, search: { tab: lastItemsTab } })
	}

	const goToPrevious = () => {
		if (window.history.length > 1) window.history.back()
		else navigate({ to: ROUTES.ITEMS, search: { tab: lastItemsTab } })
	}

	const handleTypeChange = (next: EntityType) => {
		setEntityType(next)
		if (mode === 'view') {
			updateItem.mutate({ id: item.id, entityType: next, statusId: next === 'task' ? undefined : null })
		} else if (next === 'task' && statusId == null) {
			const def = statuses?.find((s) => s.isDefault) ?? statuses?.[0]
			if (def) setStatusId(def.id)
		}
	}

	const closeChildModal = () => {
		setCreateChildOpen(false)
		setAddChildMode('create')
		setChildId(null)
		setAttachChildId(null)
	}

	const handleAddChild = async () => {
		setCreateChildOpen(true)
		if (childId != null) return
		const created = await addItem.mutateAsync({
			name: t('items.defaultName'),
			description: EMPTY_DESCRIPTION,
			parentId: item.id,
			entityType: 'task',
		})
		setChildId(created.id)
	}

	return (
		<Container fluid pt='md' pb={isModal ? 0 : 80}>
			<Stack>
				<Group justify='space-between'>
					<Title order={1} styles={{ root: { display: 'flex', alignItems: 'center', gap: 12 } }}>
						{editable ? (
							<TextInput
								variant='unstyled'
								value={name}
								onChange={(e) => setName(e.currentTarget.value)}
								placeholder={t('entities.editTitle', { type: entityLabel })}
								data-autofocus
								required
								styles={{
									root: { flex: 1 },
									input: {
										fontSize: 'inherit',
										fontWeight: 'inherit',
										lineHeight: 'inherit',
										height: 'auto',
										padding: 0,
										minWidth: 0,
										color: 'var(--mantine-color-text)',
									},
								}}
							/>
						) : (
							<>
								{item!.name}
								<EntityTypeBadge entityType={item!.entityType} />
							</>
						)}
					</Title>
					<Group gap='sm' wrap='nowrap'>
						{item && <TimerControl itemId={item.id} duration={item.totalDuration} />}
						<SegmentedControl
							color='blue'
							value={displayedEntityType}
							onChange={(v) => handleTypeChange(v as EntityType)}
							data={[
								{ value: 'task', label: t('entity.task') },
								{ value: 'note', label: t('entity.note') },
							]}
						/>
					</Group>
				</Group>
				<Group gap='sm' wrap='wrap' align='center'>
					{mode === 'view' ? (
						<Group gap='xs' wrap='nowrap'>
							<IconFolder size={14} />
							<Text size='sm' c={groupChain ? undefined : 'dimmed'}>
								{groupChain || t('groups.noGroup')}
							</Text>
						</Group>
					) : (
						<Popover>
							<Popover.Target>
								<Group gap='xs' wrap='nowrap' style={{ cursor: 'pointer' }}>
									<IconFolder size={14} />
									<Text size='sm' c={groupChain ? undefined : 'dimmed'}>
										{groupChain || t('groups.noGroup')}
									</Text>
								</Group>
							</Popover.Target>
							<Popover.Dropdown>
								<TreeSelect
									searchable
									clearable
									defaultExpandAll
									nothingFoundMessage={t('groups.nothingFound')}
									data={groupTree}
									value={currentGroupId != null ? String(currentGroupId) : null}
									onChange={(v) => setGroupId(v ? Number(v) : null)}
									disabled={!groups.length}
									w={260}
								/>
							</Popover.Dropdown>
						</Popover>
					)}
					{mode === 'view' ? (
						<MyDayControl itemId={item!.id} size='sm' myDayDate={item!.myDayDate} />
					) : (
						<MyDayControl inMyDay={addToMyDay} size='sm' onToggle={() => setAddToMyDay((v) => !v)} />
					)}
					{mode === 'view' && item && <ItemCostPill item={item} />}
					{mode !== 'view' && (
						<PropertyPill leading={<IconCoin size={14} />}>
							<NumberInput
								variant='unstyled'
								placeholder={t('items.hourlyRatePlaceholder')}
								value={hourlyRate}
								onChange={(v) => setHourlyRate(v)}
								hideControls
								w={70}
								leftSection={<span style={{ display: 'none' }} />}
								rightSection={<span style={{ display: 'none' }} />}
								styles={{ input: FIELD_TEXT_STYLE }}
							/>
						</PropertyPill>
					)}
					{isEdit && item && <ItemCostPill item={item} />}
					{item && (
						<PropertyPill leading={<IconClock size={14} />} onClick={() => setShowTimeEntries(true)}>
							<Text size='sm'>{t('timeEntries.title')}</Text>
						</PropertyPill>
					)}
					{mode === 'view' ? (
						item!.reminderAt && (
							<PropertyPill leading={<IconClock size={14} />} color={isPast ? 'red' : 'dimmed'}>
								<Text size='sm'>
									{t('items.reminder')}:{' '}
									{new Date(item!.reminderAt).toLocaleString(undefined, {
										dateStyle: 'short',
										timeStyle: 'short',
									})}
								</Text>
							</PropertyPill>
						)
					) : (
						<PropertyPill leading={<IconClock size={14} />}>
							<DateTimePicker
								variant='unstyled'
								placeholder={t('items.reminder')}
								value={reminderAt}
								onChange={setReminderAt}
								valueFormat='DD.MM.YYYY HH:mm'
								clearable
								clearSectionMode='clear'
								rightSection={<span style={{ display: 'none' }} />}
								styles={{ input: FIELD_TEXT_STYLE }}
							/>
						</PropertyPill>
					)}
					{displayedEntityType === 'task' &&
						status &&
						(editable ? (
							<StatusBadge status={status} onStatusChange={(id) => setStatusId(id)} size='sm' />
						) : (
							<StatusBadge status={status} itemId={item!.id} size='sm' />
						))}
					{mode !== 'view' && (
						<PropertyPill leading={<IconFolder size={14} />}>
							<Select
								variant='unstyled'
								placeholder={t('entities.parentSearchPlaceholder')}
								clearable
								searchable
								data={parentOptions}
								value={parentId != null ? String(parentId) : null}
								onChange={(value) => setParentId(value ? Number(value) : null)}
								disabled={!entities.length}
								rightSection={<span style={{ display: 'none' }} />}
								styles={{ input: FIELD_TEXT_STYLE }}
							/>
						</PropertyPill>
					)}
				</Group>

				{mode === 'view' ? (
					item!.descriptionMd && <MarkdownPreview content={item!.descriptionMd} variant='full' />
				) : (
					<RichTextEditor
						ref={editorRef}
						onReady={() => setEditorReady(true)}
						placeholder={t('items.enterDescription')}
					/>
				)}
				{mode === 'view' && item && (
					<>
						<EntityHierarchy
							entity={item}
							onAddChild={handleAddChild}
							parentOptions={parentOptions}
							parentId={item.parentId != null ? String(item.parentId) : null}
							onParentChange={(value) => updateItem.mutate({ id: item.id, parentId: value ? Number(value) : null })}
							parentDisabled={updateItem.isPending}
						/>
					</>
				)}
				{isModal && (
					<Group justify='flex-end' mt='lg'>
						<Button variant='default' leftSection={<IconX size={16} />} onClick={goBack}>
							{t('common.cancel')}
						</Button>
					</Group>
				)}
			</Stack>
			{!isModal && (
				<Box
					p='md'
					style={{
						position: 'fixed',
						left: 'calc(var(--app-shell-navbar-width) + var(--mantine-spacing-md))',
						right: 'var(--mantine-spacing-md)',
						bottom: 0,
						zIndex: 100,
						background: 'var(--mantine-color-body)',
						borderTop: '1px solid var(--mantine-color-default-border)',
					}}
				>
					<Group justify='space-between'>
						<Group gap='xs'>
							{editable && (
								<SaveStatusDot
									status={saveStatus}
									onRetry={saveStatus === 'error' ? () => void runAutosave() : undefined}
								/>
							)}
							{item && (
								<Text size='xs' c='dimmed'>
									{t('common.created', { date: new Date(item.createdAt).toLocaleString() })}
								</Text>
							)}
						</Group>
						<Group>
							{mode === 'view' ? (
								<>
									<Button variant='default' leftSection={<IconArrowLeft size={16} />} onClick={goToPrevious}>
										{t('common.back')}
									</Button>
									<Button
										variant='default'
										leftSection={<IconEdit size={16} />}
										onClick={() => navigate({ to: ROUTES.ITEM_EDIT, params: { id: String(item!.id) } })}
									>
										{t('common.edit')}
									</Button>
									<Button
										variant='light'
										color='red'
										leftSection={<IconTrash size={16} />}
										onClick={() =>
											confirmDelete(() =>
												deleteItem.mutate(item!.id, {
													onSuccess: () => navigate({ to: ROUTES.ITEMS, search: { tab: lastItemsTab } }),
												}),
											)
										}
									>
										{t('common.delete')}
									</Button>
								</>
							) : (
								<>
									<Button variant='default' leftSection={<IconX size={16} />} onClick={goBack}>
										{t('common.cancel')}
									</Button>
									<Button
										variant='light'
										color='red'
										leftSection={<IconTrash size={16} />}
										onClick={() =>
											confirmDelete(() =>
												deleteItem.mutate(item!.id, {
													onSuccess: () => navigate({ to: ROUTES.ITEMS, search: { tab: lastItemsTab } }),
												}),
											)
										}
									>
										{t('common.delete')}
									</Button>
								</>
							)}
						</Group>
					</Group>
				</Box>
			)}

			{confirmDeleteModal}

			{item && (
				<Modal opened={createChildOpen} onClose={closeChildModal} title={t('entities.addChild')} size='xl' centered>
					<SegmentedControl
						value={addChildMode}
						onChange={(v) => {
							setAddChildMode(v as 'create' | 'attach')
							setAttachChildId(null)
						}}
						data={[
							{ value: 'create', label: t('common.create') },
							{ value: 'attach', label: t('entities.attachExisting') },
						]}
					/>
					{childId != null && addChildMode === 'create' ? (
						<ItemPage id={childId} mode='edit' isModal onCancel={closeChildModal} />
					) : (
						<Group mt='md'>
							<Select
								flex={1}
								searchable
								placeholder={t('entities.searchPlaceholder')}
								data={parentOptions}
								value={attachChildId}
								onChange={setAttachChildId}
							/>
							<Button
								disabled={attachChildId == null}
								onClick={() => {
									updateItem.mutate({ id: Number(attachChildId), parentId: item.id })
									closeChildModal()
								}}
							>
								{t('entities.attach')}
							</Button>
						</Group>
					)}
				</Modal>
			)}

			{showTimeEntries && item && <ItemTimeEntriesModal item={item} onClose={() => setShowTimeEntries(false)} />}
		</Container>
	)
}
