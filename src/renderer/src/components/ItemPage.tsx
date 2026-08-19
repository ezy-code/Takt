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
	TreeSelect,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
	IconArrowLeft,
	IconClock,
	IconCoin,
	IconDeviceFloppy,
	IconEdit,
	IconFolder,
	IconPlus,
	IconTrash,
	IconTrashX,
	IconX,
} from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
	e.preventDefault()
	const submitter = (e.nativeEvent as SubmitEvent).submitter
	if (submitter && submitter.getAttribute('type') !== 'submit') return
	submit()
}

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
	mode: 'view' | 'edit' | 'create'
	onCreated?: (item: Item) => void
	onCancel?: () => void
	initialEntityType?: EntityType
	initialParentId?: number | null
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

const FIELD_TEXT_STYLE = {
	fontSize: 'var(--mantine-font-size-sm)',
	fontWeight: 'normal',
	color: 'var(--mantine-color-text)',
	padding: 0,
	height: 'auto',
	minHeight: 'auto',
	cursor: 'pointer',
} as const

export function ItemPage({ id, mode, onCreated, onCancel, initialEntityType, initialParentId }: ItemPageProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const editable = mode !== 'view'
	const isEdit = mode === 'edit'
	const isModal = onCreated != null
	const [editorReady, setEditorReady] = useState(false)

	const { data: item, isLoading } = useItem(id ?? 0)
	const { data: statuses } = useStatuses()
	const { data: entities = [] } = useItems()
	const { data: groups = [] } = useGroups()
	const addItem = useAddItem()
	const updateItem = useUpdateItem()
	const deleteItem = useDeleteItem()

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
	const [attachChildId, setAttachChildId] = useState<string | null>(null)
	const [confirmDeleteModal, confirmDelete] = useConfirmDelete({
		title: t('items.deleteTitle'),
		message: t('items.deleteBody'),
	})
	const initialRef = useRef<ItemSnapshot | null>(null)
	const savedRef = useRef(false)

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
		if (item) setEntityType(item.entityType ?? 'task')
		if (isEdit && item) {
			setStatusId(item.entityType === 'task' ? (item.statusId ?? null) : null)
			setParentId(item.parentId ?? null)
			setGroupId(item.groupId ?? null)
			setAddToMyDay(!!item.my_day_date)
			setReminderAt(item.reminder_at ? dayjs(item.reminder_at).format('YYYY-MM-DD HH:mm:ss') : null)
			setHourlyRate(item.hourly_rate ?? '')
		} else if (mode === 'create' && statuses) {
			const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]
			const type = initialEntityType ?? 'task'
			setEntityType(type)
			setStatusId(type === 'task' ? (defaultStatus?.id ?? null) : null)
			setParentId(initialParentId ?? null)
			setGroupId(null)
			setAddToMyDay(false)
			setReminderAt(null)
			setHourlyRate('')
		}
	}, [isEdit, mode, item, statuses])

	useEffect(() => {
		if (isEdit && item && editorReady) {
			editorRef.current?.injectJSON(item.description ?? '')
		}
	}, [isEdit, item, editorReady])

	const form = useForm({
		defaultValues: { name: '' },
		onSubmit: async ({ value }) => {
			if (!value.name.trim()) return
			const editor = editorRef.current
			const raw = editor?.getJSON()
			const description = raw ?? (isEdit ? '' : '{}')
			const description_md = editor?.getMarkdown() ?? ''
			const description_html = editor?.getHTML() ?? ''
			const payload = {
				name: value.name.trim(),
				description,
				description_md,
				description_html,
				statusId: entityType === 'task' ? statusId : null,
				parentId: parentId ?? null,
				groupId: groupId ?? null,
				myDay: addToMyDay,
				reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
				hourlyRate: hourlyRate === '' ? null : Number(hourlyRate),
				entityType,
			}
			if (isEdit) {
				await updateItem.mutateAsync({ id: id!, ...payload })
				savedRef.current = true
				navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(id) } })
			} else if (mode === 'create') {
				const created = await addItem.mutateAsync(payload)
				savedRef.current = true
				if (onCreated) onCreated(created)
				else navigate({ to: ROUTES.ITEM_DETAIL, params: { id: String(created.id) } })
			}
		},
	})

	useEffect(() => {
		if (isEdit && item) {
			form.setFieldValue('name', item.name)
		}
	}, [isEdit, item, form])

	useEffect(() => {
		if (!editable) return
		if (isEdit && (!item || !editorReady)) return
		if (mode === 'create' && (!statuses || !editorReady)) return
		const timer = setTimeout(() => {
			const currentItem = isEdit && item ? item : null
			initialRef.current = {
				name: isEdit ? currentItem!.name : '',
				statusId: isEdit
					? currentItem!.entityType === 'task'
						? (currentItem!.statusId ?? null)
						: null
					: (initialEntityType ?? 'task') === 'task'
						? (statuses?.find((s) => s.is_default)?.id ?? null)
						: null,
				parentId: isEdit ? (currentItem!.parentId ?? null) : (initialParentId ?? null),
				groupId: isEdit ? (currentItem!.groupId ?? null) : null,
				addToMyDay: isEdit ? !!currentItem!.my_day_date : false,
				reminderAt: isEdit
					? currentItem!.reminder_at
						? dayjs(currentItem!.reminder_at).format('YYYY-MM-DD HH:mm:ss')
						: null
					: null,
				hourlyRate: isEdit ? (currentItem!.hourly_rate ?? null) : null,
				entityType: isEdit ? (currentItem!.entityType ?? 'task') : (initialEntityType ?? 'task'),
				description: editorRef.current?.getJSON() ?? '',
			}
		}, 150)
		return () => clearTimeout(timer)
	}, [editable, isEdit, mode, item, statuses, editorReady, initialParentId])

	const isDirty = () => {
		const s = initialRef.current
		if (!s) return false
		return (
			form.state.values.name !== s.name ||
			statusId !== s.statusId ||
			parentId !== s.parentId ||
			groupId !== s.groupId ||
			addToMyDay !== s.addToMyDay ||
			reminderAt !== s.reminderAt ||
			(hourlyRate === '' ? null : Number(hourlyRate)) !== s.hourlyRate ||
			entityType !== s.entityType ||
			(editorRef.current?.getJSON() ?? '') !== s.description
		)
	}

	const blocker = useBlocker({
		shouldBlockFn: ({ current, next }) =>
			!isModal && !savedRef.current && isDirty() && current.pathname !== next.pathname,
		enableBeforeUnload: false,
		withResolver: true,
	})

	if (mode !== 'create' && isLoading)
		return (
			<Container fluid py='md'>
				<Text c='dimmed'>{t('common.loading')}</Text>
			</Container>
		)
	if (mode !== 'create' && !item)
		return (
			<Container fluid py='md'>
				<Text c='red'>{t('items.notFound')}</Text>
			</Container>
		)

	const status = statuses?.find((s) => s.id === (mode === 'view' ? item?.statusId : statusId))
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
		if (next !== 'task') setStatusId(null)
		if (mode === 'view' && item) {
			updateItem.mutate({ id: item.id, entityType: next, statusId: next === 'task' ? undefined : null })
		}
	}

	return (
		<Container fluid pt='md' pb={isModal ? 0 : 80}>
			<form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
				<Stack>
					<Group justify='space-between'>
						<Title order={1} styles={{ root: { display: 'flex', alignItems: 'center', gap: 12 } }}>
							{editable ? (
								<form.Field name='name'>
									{(field) => (
										<TextInput
											variant='unstyled'
											value={field.state.value}
											onChange={(e) => field.handleChange(e.currentTarget.value)}
											placeholder={t(isEdit ? 'entities.editTitle' : 'entities.newTitle', { type: entityLabel })}
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
									)}
								</form.Field>
							) : (
								<>
									{item!.name}
									<EntityTypeBadge entityType={item!.entityType} />
								</>
							)}
						</Title>
						<Group gap='sm' wrap='nowrap'>
							{mode !== 'create' && item && <TimerControl itemId={item.id} duration={item.total_duration} />}
							<SegmentedControl
								color='blue'
								value={entityType}
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
							<MyDayControl itemId={item!.id} size='sm' myDayDate={item!.my_day_date} />
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
						{mode !== 'create' && item && (
							<PropertyPill leading={<IconClock size={14} />} onClick={() => setShowTimeEntries(true)}>
								<Text size='sm'>{t('timeEntries.title')}</Text>
							</PropertyPill>
						)}
						{mode === 'view' ? (
							item!.reminder_at && (
								<PropertyPill leading={<IconClock size={14} />} color={isPast ? 'red' : 'dimmed'}>
									<Text size='sm'>
										{t('items.reminder')}:{' '}
										{new Date(item!.reminder_at).toLocaleString(undefined, {
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
						{entityType === 'task' &&
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
						item!.description_md && <MarkdownPreview content={item!.description_md} variant='full' />
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
								onAddChild={() => setCreateChildOpen(true)}
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
							<Button type='submit' leftSection={<IconPlus size={16} />}>
								{t('common.create')}
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
							{mode !== 'create' && item && (
								<Text size='xs' c='dimmed'>
									{t('common.created', { date: new Date(item.created_at).toLocaleString() })}
								</Text>
							)}
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
											type='submit'
											leftSection={isEdit ? <IconDeviceFloppy size={16} /> : <IconPlus size={16} />}
										>
											{isEdit ? t('common.save') : t('common.create')}
										</Button>
									</>
								)}
							</Group>
						</Group>
					</Box>
				)}
			</form>

			{editable && (
				<Modal
					opened={blocker.status === 'blocked'}
					onClose={() => blocker.reset?.()}
					title={t('items.unsavedTitle')}
					centered
				>
					<Text>{t('items.unsavedBody')}</Text>
					<Group justify='flex-end' mt='lg'>
						<Button variant='default' leftSection={<IconX size={16} />} onClick={() => blocker.reset?.()}>
							{t('common.cancel')}
						</Button>
						<Button
							color='red'
							variant='outline'
							leftSection={<IconTrashX size={16} />}
							onClick={() => blocker.proceed?.()}
						>
							{t('common.discard')}
						</Button>
						<Button
							leftSection={<IconDeviceFloppy size={16} />}
							onClick={() => {
								blocker.reset?.()
								form.handleSubmit()
							}}
						>
							{t('common.save')}
						</Button>
					</Group>
				</Modal>
			)}

			{confirmDeleteModal}

			{item && (
				<Modal
					opened={createChildOpen}
					onClose={() => {
						setCreateChildOpen(false)
						setAddChildMode('create')
						setAttachChildId(null)
					}}
					title={t('entities.addChild')}
					size='xl'
					centered
				>
					<SegmentedControl
						value={addChildMode}
						onChange={(v) => setAddChildMode(v as 'create' | 'attach')}
						data={[
							{ value: 'create', label: t('common.create') },
							{ value: 'attach', label: t('entities.attachExisting') },
						]}
					/>
					{addChildMode === 'create' ? (
						<ItemPage
							mode='create'
							initialParentId={item.id}
							onCancel={() => setCreateChildOpen(false)}
							onCreated={() => setCreateChildOpen(false)}
						/>
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
									setCreateChildOpen(false)
									setAddChildMode('create')
									setAttachChildId(null)
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
