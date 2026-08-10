import type { ExtensiveEditorRef } from '@lyfie/luthor'
import { Button, Container, Group, Modal, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconClock, IconFolder } from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddTask, useClearMyDay, useProjects, useStatuses, useTask, useToggleMyDay, useUpdateTask } from '../api'
import { ROUTES } from '../routes'
import { MarkdownPreview } from './MarkdownPreview'
import { MyDayControl } from './MyDayControl'
import { PropertyPill } from './PropertyPill'
import { RichTextEditor } from './RichTextEditor'
import { TaskTimeEntriesModal } from './TaskTimeEntriesModal'
import { TimerControl } from './TimerControl'

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
	e.preventDefault()
	const submitter = (e.nativeEvent as SubmitEvent).submitter
	if (submitter && submitter.getAttribute('type') !== 'submit') return
	submit()
}

interface TaskPageProps {
	id?: number
	mode: 'view' | 'edit' | 'create'
}

interface TaskSnapshot {
	name: string
	statusId: number | null
	projectId: number | null
	addToMyDay: boolean
	reminderAt: string | null
	description: string
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

export function TaskPage({ id, mode }: TaskPageProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const editable = mode !== 'view'
	const isEdit = mode === 'edit'
	const [editorReady, setEditorReady] = useState(false)

	const { data: task, isLoading } = useTask(id ?? 0)
	const { data: statuses } = useStatuses()
	const { data: projects } = useProjects()
	const addTask = useAddTask()
	const updateTask = useUpdateTask()
	const toggleMyDay = useToggleMyDay()
	const clearMyDay = useClearMyDay()

	const [statusId, setStatusId] = useState<number | null>(null)
	const [projectId, setProjectId] = useState<number | null>(null)
	const [addToMyDay, setAddToMyDay] = useState(false)
	const [reminderAt, setReminderAt] = useState<string | null>(null)
	const [showTimeEntries, setShowTimeEntries] = useState(false)
	const initialRef = useRef<TaskSnapshot | null>(null)
	const savedRef = useRef(false)

	useEffect(() => {
		if (isEdit && task) {
			setStatusId(task.statusId ?? null)
			setProjectId(task.projectId ?? null)
			setAddToMyDay(!!task.my_day_date)
			setReminderAt(task.reminder_at ? dayjs(task.reminder_at).format('YYYY-MM-DD HH:mm:ss') : null)
		} else if (mode === 'create' && statuses) {
			const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]
			setStatusId(defaultStatus?.id ?? null)
			setProjectId(null)
			setAddToMyDay(false)
			setReminderAt(null)
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
				statusId: statusId ?? undefined,
				projectId: projectId ?? undefined,
				myDay: addToMyDay,
				reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
			}
			if (isEdit) {
				await updateTask.mutateAsync({ id: id!, ...payload })
				savedRef.current = true
				navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
			} else if (mode === 'create') {
				await addTask.mutateAsync(payload)
				savedRef.current = true
				navigate({ to: ROUTES.TASKS, search: { tab: 'list' } })
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
				statusId: isEdit ? (currentTask!.statusId ?? null) : (statuses?.find((s) => s.is_default)?.id ?? null),
				projectId: isEdit ? (currentTask!.projectId ?? null) : null,
				addToMyDay: isEdit ? !!currentTask!.my_day_date : false,
				reminderAt: isEdit
					? currentTask!.reminder_at
						? dayjs(currentTask!.reminder_at).format('YYYY-MM-DD HH:mm:ss')
						: null
					: null,
				description: editorRef.current?.getJSON() ?? '',
			}
		}, 150)
		return () => clearTimeout(timer)
	}, [editable, isEdit, mode, task, statuses, editorReady])

	const isDirty = () => {
		const s = initialRef.current
		if (!s) return false
		return (
			form.state.values.name !== s.name ||
			statusId !== s.statusId ||
			projectId !== s.projectId ||
			addToMyDay !== s.addToMyDay ||
			reminderAt !== s.reminderAt ||
			(editorRef.current?.getJSON() ?? '') !== s.description
		)
	}

	const blocker = useBlocker({
		shouldBlockFn: ({ current, next }) => !savedRef.current && isDirty() && current.pathname !== next.pathname,
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
	const project = projects?.find((p) => p.id === (mode === 'view' ? task?.projectId : projectId))
	const isPast = task?.reminder_at != null && new Date(task.reminder_at).getTime() < Date.now()
	const statusColor = statuses?.find((s) => s.id === statusId)?.color ?? '#868e96'

	const statusOptions = (statuses ?? []).map((s) => ({
		value: String(s.id),
		label: s.name,
	}))

	const projectOptions = (projects ?? []).map((p) => ({
		value: String(p.id),
		label: p.name,
	}))

	const goBack = () => {
		if (isEdit) navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
		else navigate({ to: ROUTES.TASKS, search: { tab: 'list' } })
	}

	return (
		<Container fluid pt='md' pb={64}>
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
											placeholder={isEdit ? t('tasks.editTitle') : t('tasks.newTitle')}
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
								task!.name
							)}
						</Title>
						<Group>
							{mode === 'view' ? (
								<>
									<Button
										variant='default'
										onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task!.id) } })}
									>
										{t('common.edit')}
									</Button>
									<Button variant='default' onClick={() => navigate({ to: ROUTES.TASKS, search: { tab: 'list' } })}>
										{t('common.back')}
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
					</Group>

					<Group align='flex-start' wrap='nowrap' gap='lg'>
						<div style={{ flex: 1, minWidth: 0 }}>
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
								width: '25%',
								flexShrink: 0,
								border: '1px solid var(--mantine-color-default-border)',
								borderRadius: 'var(--mantine-radius-md)',
								padding: 'var(--mantine-spacing-md)',
							}}
						>
							{mode !== 'create' && task && <TimerControl taskId={task.id} duration={task.total_duration} />}
							{mode !== 'create' && task && (
								<PropertyPill leading={<IconClock size={14} />} onClick={() => setShowTimeEntries(true)}>
									<Text size='sm'>{t('timeEntries.title')}</Text>
								</PropertyPill>
							)}
							{mode === 'view' ? (
								<MyDayControl
									fullWidth
									inMyDay={!!task!.my_day_date}
									onToggle={() => {
										if (task!.my_day_date) clearMyDay.mutate(task!.id)
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
							{mode === 'view' ? (
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
									leading={<div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor }} />}
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
							)}
							{mode === 'view' ? (
								project && (
									<PropertyPill leading={<IconFolder size={14} />} color='dimmed'>
										<Text size='sm'>{project.name}</Text>
									</PropertyPill>
								)
							) : (
								<PropertyPill leading={<IconFolder size={14} />}>
									<Select
										variant='unstyled'
										placeholder={t('tasks.selectProject')}
										clearable
										searchable
										data={projectOptions}
										value={projectId != null ? String(projectId) : null}
										onChange={(value) => setProjectId(value ? Number(value) : null)}
										disabled={!projects?.length}
										rightSection={<span style={{ display: 'none' }} />}
										styles={{ input: FIELD_TEXT_STYLE }}
									/>
								</PropertyPill>
							)}
						</Stack>
					</Group>
				</Stack>
			</form>

			{mode !== 'create' && task && (
				<Text
					size='xs'
					c='dimmed'
					style={{ position: 'fixed', bottom: 12, right: 16, zIndex: 100, userSelect: 'none' }}
				>
					{t('projects.created', { date: new Date(task.created_at).toLocaleString() })}
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

			{showTimeEntries && task && <TaskTimeEntriesModal task={task} onClose={() => setShowTimeEntries(false)} />}
		</Container>
	)
}
