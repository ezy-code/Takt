import type { ExtensiveEditorRef } from '@lyfie/luthor'
import {
	Button,
	Container,
	Group,
	Modal,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useMediaQuery } from '@mantine/hooks'
import { IconClock, IconCoin, IconFolder, IconTrash } from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	useAddTask,
	useClearMyDay,
	useDeleteTask,
	useStatuses,
	useTask,
	useTasks,
	useToggleMyDay,
	useUpdateTask,
} from '../api'
import { ROUTES } from '../routes'
import { lastTasksTab } from '../store/lastTasksTab'
import type { EntityType, Task } from '../types'
import { useConfirmDelete } from './ConfirmDeleteModal'
import { EntityHierarchy } from './EntityHierarchy'
import { EntityTypeBadge } from './EntityTypeBadge'
import { MarkdownPreview } from './MarkdownPreview'
import { MyDayControl } from './MyDayControl'
import { PropertyPill } from './PropertyPill'
import { RichTextEditor } from './RichTextEditor'
import { getMyDayState } from './TaskCard'
import { TaskCostPill } from './TaskCostPill'
import { TaskTimeEntriesModal } from './TaskTimeEntriesModal'
import { TimerControl } from './TimerControl'

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
	e.preventDefault()
	const submitter = (e.nativeEvent as SubmitEvent).submitter
	if (submitter && submitter.getAttribute('type') !== 'submit') return
	submit()
}

function isDescendant(entities: Task[], entityId: number | undefined, candidateParentId: number) {
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

interface TaskPageProps {
	id?: number
	mode: 'view' | 'edit' | 'create'
	onCreated?: (task: Task) => void
	onCancel?: () => void
	initialEntityType?: EntityType
	initialParentId?: number | null
}

interface TaskSnapshot {
	name: string
	statusId: number | null
	parentId: number | null
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

export function TaskPage({ id, mode, onCreated, onCancel, initialEntityType, initialParentId }: TaskPageProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const editable = mode !== 'view'
	const isEdit = mode === 'edit'
	const isModal = onCreated != null
	const [editorReady, setEditorReady] = useState(false)

	const { data: task, isLoading } = useTask(id ?? 0)
	const { data: statuses } = useStatuses()
	const { data: entities = [] } = useTasks()
	const addTask = useAddTask()
	const updateTask = useUpdateTask()
	const toggleMyDay = useToggleMyDay()
	const clearMyDay = useClearMyDay()
	const deleteTask = useDeleteTask()

	const [statusId, setStatusId] = useState<number | null>(null)
	const [parentId, setParentId] = useState<number | null>(null)
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
		title: t('tasks.deleteTitle'),
		message: t('tasks.deleteBody'),
	})
	const compact = useMediaQuery('(max-width: 900px)')
	const initialRef = useRef<TaskSnapshot | null>(null)
	const savedRef = useRef(false)

	useEffect(() => {
		if (task) setEntityType(task.entityType ?? 'task')
		if (isEdit && task) {
			setStatusId(task.entityType === 'task' ? (task.statusId ?? null) : null)
			setParentId(task.parentId ?? null)
			setAddToMyDay(!!task.my_day_date)
			setReminderAt(task.reminder_at ? dayjs(task.reminder_at).format('YYYY-MM-DD HH:mm:ss') : null)
			setHourlyRate(task.hourly_rate ?? '')
		} else if (mode === 'create' && statuses) {
			const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]
			const type = initialEntityType ?? 'task'
			setEntityType(type)
			setStatusId(type === 'task' ? (defaultStatus?.id ?? null) : null)
			setParentId(initialParentId ?? null)
			setAddToMyDay(false)
			setReminderAt(null)
			setHourlyRate('')
		}
	}, [isEdit, mode, task, statuses])

	useEffect(() => {
		if (isEdit && task && editorReady) {
			editorRef.current?.injectJSON(task.description ?? '')
		}
	}, [isEdit, task, editorReady])

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
				myDay: addToMyDay,
				reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
				hourlyRate: hourlyRate === '' ? null : Number(hourlyRate),
				entityType,
			}
			if (isEdit) {
				await updateTask.mutateAsync({ id: id!, ...payload })
				savedRef.current = true
				navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
			} else if (mode === 'create') {
				const created = await addTask.mutateAsync(payload)
				savedRef.current = true
				if (onCreated) onCreated(created)
				else navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(created.id) } })
			}
		},
	})

	useEffect(() => {
		if (isEdit && task) {
			form.setFieldValue('name', task.name)
		}
	}, [isEdit, task, form])

	useEffect(() => {
		if (!editable) return
		if (isEdit && (!task || !editorReady)) return
		if (mode === 'create' && (!statuses || !editorReady)) return
		const timer = setTimeout(() => {
			const currentTask = isEdit && task ? task : null
			initialRef.current = {
				name: isEdit ? currentTask!.name : '',
				statusId: isEdit
					? currentTask!.entityType === 'task'
						? (currentTask!.statusId ?? null)
						: null
					: (initialEntityType ?? 'task') === 'task'
						? (statuses?.find((s) => s.is_default)?.id ?? null)
						: null,
				parentId: isEdit ? (currentTask!.parentId ?? null) : (initialParentId ?? null),
				addToMyDay: isEdit ? !!currentTask!.my_day_date : false,
				reminderAt: isEdit
					? currentTask!.reminder_at
						? dayjs(currentTask!.reminder_at).format('YYYY-MM-DD HH:mm:ss')
						: null
					: null,
				hourlyRate: isEdit ? (currentTask!.hourly_rate ?? null) : null,
				entityType: isEdit ? (currentTask!.entityType ?? 'task') : (initialEntityType ?? 'task'),
				description: editorRef.current?.getJSON() ?? '',
			}
		}, 150)
		return () => clearTimeout(timer)
	}, [editable, isEdit, mode, task, statuses, editorReady, initialParentId])

	const isDirty = () => {
		const s = initialRef.current
		if (!s) return false
		return (
			form.state.values.name !== s.name ||
			statusId !== s.statusId ||
			parentId !== s.parentId ||
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
	if (mode !== 'create' && !task)
		return (
			<Container fluid py='md'>
				<Text c='red'>{t('tasks.notFound')}</Text>
			</Container>
		)

	const status = statuses?.find((s) => s.id === (mode === 'view' ? task?.statusId : statusId))
	const isPast = task?.reminder_at != null && new Date(task.reminder_at).getTime() < Date.now()
	const statusColor = statuses?.find((s) => s.id === statusId)?.color ?? '#868e96'

	const statusOptions = (statuses ?? []).map((s) => ({
		value: String(s.id),
		label: s.name,
	}))

	const parentOptions = entities
		.filter((entity) => entity.id !== task?.id && !isDescendant(entities, task?.id, entity.id))
		.map((entity) => ({
			value: String(entity.id),
			label: `${entity.name} · ${t(`entity.${entity.entityType ?? 'task'}`)}`,
		}))

	const goBack = () => {
		if (onCancel) onCancel()
		else if (isEdit) navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
		else navigate({ to: ROUTES.TASKS, search: { tab: lastTasksTab } })
	}

	const goToPrevious = () => {
		if (window.history.length > 1) window.history.back()
		else navigate({ to: ROUTES.TASKS, search: { tab: lastTasksTab } })
	}

	const handleTypeChange = (next: EntityType) => {
		setEntityType(next)
		if (next !== 'task') setStatusId(null)
		if (mode === 'view' && task) {
			updateTask.mutate({ id: task.id, entityType: next, statusId: next === 'task' ? undefined : null })
		}
	}

	return (
		<Container fluid pt='md' pb={isModal ? 0 : 64}>
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
									{task!.name}
									<EntityTypeBadge entityType={task!.entityType} />
								</>
							)}
						</Title>
						{!isModal && (
							<Group>
								{mode === 'view' ? (
									<>
										<Button
											variant='default'
											onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task!.id) } })}
										>
											{t('common.edit')}
										</Button>
										<Button variant='default' onClick={goToPrevious}>
											{t('common.back')}
										</Button>
										<Button
											variant='light'
											color='red'
											leftSection={<IconTrash size={16} />}
											onClick={() =>
												confirmDelete(() =>
													deleteTask.mutate(task!.id, {
														onSuccess: () => navigate({ to: ROUTES.TASKS, search: { tab: lastTasksTab } }),
													}),
												)
											}
										>
											{t('common.delete')}
										</Button>
									</>
								) : (
									<>
										<Button variant='default' onClick={goBack}>
											{t('common.cancel')}
										</Button>
										<Button type='submit'>{isEdit ? t('common.save') : t('common.create')}</Button>
									</>
								)}
							</Group>
						)}
					</Group>

					<Group align='flex-start' wrap={compact ? 'wrap' : 'nowrap'} gap='lg'>
						<div style={{ flex: 1, minWidth: 0, width: compact ? '100%' : undefined }}>
							{mode === 'view' ? (
								task!.description_md && <MarkdownPreview content={task!.description_md} variant='full' />
							) : (
								<RichTextEditor
									ref={editorRef}
									onReady={() => setEditorReady(true)}
									placeholder={t('tasks.enterDescription')}
								/>
							)}
						</div>
						<Stack
							align='flex-start'
							gap='sm'
							style={{
								width: compact ? '100%' : '25%',
								flexShrink: 0,
								border: '1px solid var(--mantine-color-default-border)',
								borderRadius: 'var(--mantine-radius-md)',
								padding: 'var(--mantine-spacing-md)',
							}}
						>
							{mode !== 'create' && task && <TimerControl taskId={task.id} duration={task.total_duration} />}
							<SegmentedControl
								color='blue'
								value={entityType}
								onChange={(v) => handleTypeChange(v as EntityType)}
								data={[
									{ value: 'task', label: t('entity.task') },
									{ value: 'note', label: t('entity.note') },
								]}
							/>
							{mode === 'view' && task && <TaskCostPill task={task} />}
							{mode !== 'view' && (
								<PropertyPill leading={<IconCoin size={14} />}>
									<NumberInput
										variant='unstyled'
										placeholder={t('tasks.hourlyRatePlaceholder')}
										value={hourlyRate}
										onChange={(v) => setHourlyRate(v)}
										hideControls
										leftSection={<span style={{ display: 'none' }} />}
										rightSection={<span style={{ display: 'none' }} />}
										styles={{ input: FIELD_TEXT_STYLE }}
									/>
								</PropertyPill>
							)}
							{isEdit && task && <TaskCostPill task={task} />}
							{mode !== 'create' && task && (
								<PropertyPill leading={<IconClock size={14} />} onClick={() => setShowTimeEntries(true)}>
									<Text size='sm'>{t('timeEntries.title')}</Text>
								</PropertyPill>
							)}
							{mode === 'view' ? (
								<MyDayControl
									fullWidth
									inMyDay={!!task!.my_day_date}
									overdue={getMyDayState(task!.my_day_date ?? null) === 'overdue'}
									onToggle={() => {
										if (getMyDayState(task!.my_day_date ?? null) === 'today') clearMyDay.mutate(task!.id)
										else toggleMyDay.mutate(task!.id)
									}}
								/>
							) : (
								<MyDayControl fullWidth inMyDay={addToMyDay} onToggle={() => setAddToMyDay((v) => !v)} />
							)}
							{mode === 'view' ? (
								task!.reminder_at && (
									<PropertyPill leading={<IconClock size={14} />} color={isPast ? 'red' : 'dimmed'}>
										<Text size='sm'>
											{t('tasks.reminder')}:{' '}
											{new Date(task!.reminder_at).toLocaleString(undefined, {
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
										placeholder={t('tasks.reminder')}
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
								(mode === 'view' ? (
									status && (
										<PropertyPill
											leading={
												<div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: status.color }} />
											}
										>
											<Text size='sm'>{status.name}</Text>
										</PropertyPill>
									)
								) : (
									<PropertyPill
										leading={
											<div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor }} />
										}
									>
										<Select
											variant='unstyled'
											placeholder={t('tasks.selectStatus')}
											data={statusOptions}
											value={statusId != null ? String(statusId) : null}
											onChange={(value) => setStatusId(value ? Number(value) : null)}
											disabled={!statuses?.length}
											required
											rightSection={<span style={{ display: 'none' }} />}
											styles={{ input: FIELD_TEXT_STYLE }}
										/>
									</PropertyPill>
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
						</Stack>
					</Group>
					{mode === 'view' && task && (
						<>
							<EntityHierarchy
								entity={task}
								onAddChild={() => setCreateChildOpen(true)}
								parentOptions={parentOptions}
								parentId={task.parentId != null ? String(task.parentId) : null}
								onParentChange={(value) => updateTask.mutate({ id: task.id, parentId: value ? Number(value) : null })}
								parentDisabled={updateTask.isPending}
							/>
						</>
					)}
					{isModal && (
						<Group justify='flex-end' mt='lg'>
							<Button variant='default' onClick={goBack}>
								{t('common.cancel')}
							</Button>
							<Button type='submit'>{t('common.create')}</Button>
						</Group>
					)}
				</Stack>
			</form>

			{mode !== 'create' && task && (
				<Text
					size='xs'
					c='dimmed'
					style={{ position: 'fixed', bottom: 12, right: 16, zIndex: 100, userSelect: 'none' }}
				>
					{t('common.created', { date: new Date(task.created_at).toLocaleString() })}
				</Text>
			)}

			{editable && (
				<Modal
					opened={blocker.status === 'blocked'}
					onClose={() => blocker.reset?.()}
					title={t('tasks.unsavedTitle')}
					centered
				>
					<Text>{t('tasks.unsavedBody')}</Text>
					<Group justify='flex-end' mt='lg'>
						<Button variant='default' onClick={() => blocker.reset?.()}>
							{t('common.cancel')}
						</Button>
						<Button color='red' variant='outline' onClick={() => blocker.proceed?.()}>
							{t('common.discard')}
						</Button>
						<Button
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

			{task && (
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
						<TaskPage
							mode='create'
							initialParentId={task.id}
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
									updateTask.mutate({ id: Number(attachChildId), parentId: task.id })
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

			{showTimeEntries && task && <TaskTimeEntriesModal task={task} onClose={() => setShowTimeEntries(false)} />}
		</Container>
	)
}
