import type { ExtensiveEditorRef } from '@lyfie/luthor'
import {
	Button,
	Container,
	Group,
	Select,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Title,
	useMantineColorScheme,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { type FormEvent, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddTask, useProjects, useStatuses, useTask, useUpdateTask } from '../api'
import { ROUTES } from '../routes'
import { MyDayControl } from './MyDayControl'

const ExtensiveEditor = lazy(() => import('@lyfie/luthor').then((m) => ({ default: m.ExtensiveEditor })))

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
	e.preventDefault()
	const submitter = (e.nativeEvent as SubmitEvent).submitter
	if (submitter && submitter.getAttribute('type') !== 'submit') return
	submit()
}

interface TaskFormProps {
	id?: number
}

export function TaskForm({ id }: TaskFormProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const isEdit = id != null
	const [editorReady, setEditorReady] = useState(false)
	const { colorScheme } = useMantineColorScheme()
	const editorTheme =
		colorScheme === 'auto'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: colorScheme

	const { data: task, isLoading } = useTask(id ?? 0)
	const { data: statuses } = useStatuses()
	const { data: projects } = useProjects()
	const addTask = useAddTask()
	const updateTask = useUpdateTask()

	const [statusId, setStatusId] = useState<number | null>(null)
	const [projectId, setProjectId] = useState<number | null>(null)
	const [addToMyDay, setAddToMyDay] = useState(false)
	const [reminderAt, setReminderAt] = useState<string | null>(null)

	useEffect(() => {
		if (isEdit && task) {
			setStatusId(task.statusId ?? null)
			setProjectId(task.projectId ?? null)
			setAddToMyDay(!!task.my_day_date)
			setReminderAt(task.reminder_at ? dayjs(task.reminder_at).format('YYYY-MM-DD HH:mm:ss') : null)
		} else if (!isEdit && statuses) {
			const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]
			setStatusId(defaultStatus?.id ?? null)
			setProjectId(null)
			setAddToMyDay(false)
			setReminderAt(null)
		}
	}, [isEdit, task, statuses])

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
				await updateTask.mutateAsync({ id, ...payload })
				navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
			} else {
				await addTask.mutateAsync(payload)
				navigate({ to: ROUTES.TASKS, search: { tab: 'list' } })
			}
		},
	})

	useEffect(() => {
		if (isEdit && task) {
			form.setFieldValue('name', task.name)
		}
	}, [isEdit, task, form])

	if (isEdit && !isLoading && !task)
		return (
			<Container fluid py='xl'>
				<Text c='red'>{t('tasks.notFound')}</Text>
			</Container>
		)

	const statusOptions = (statuses ?? []).map((s) => ({
		value: String(s.id),
		label: s.name,
	}))

	const projectOptions = (projects ?? []).map((p) => ({
		value: String(p.id),
		label: p.name,
	}))

	return (
		<Container fluid py='xl' pb={90}>
			<Title order={1} mb='lg'>
				{isEdit ? t('tasks.editTitle') : t('tasks.newTitle')}
			</Title>
			<form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
				<Stack>
					<form.Field name='name'>
						{(field) => (
							<TextInput
								label={t('common.name')}
								placeholder={t('tasks.enterName')}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.currentTarget.value)}
								data-autofocus
								required
							/>
						)}
					</form.Field>

					<Select
						label={t('tasks.status')}
						placeholder={t('tasks.selectStatus')}
						data={statusOptions}
						value={statusId != null ? String(statusId) : null}
						onChange={(value) => setStatusId(value ? Number(value) : null)}
						leftSection={
							statusId != null ? (
								<div
									style={{
										width: 10,
										height: 10,
										borderRadius: '50%',
										backgroundColor: statuses?.find((s) => s.id === statusId)?.color ?? '#868e96',
									}}
								/>
							) : undefined
						}
						disabled={!statuses?.length}
						required
					/>

					<Select
						label={t('tasks.project')}
						placeholder={t('tasks.selectProject')}
						clearable
						data={projectOptions}
						value={projectId != null ? String(projectId) : null}
						onChange={(value) => setProjectId(value ? Number(value) : null)}
						disabled={!projects?.length}
					/>

					<MyDayControl inMyDay={addToMyDay} onToggle={() => setAddToMyDay((v) => !v)} />

					<DateTimePicker
						label={t('tasks.reminder')}
						placeholder={t('tasks.selectReminder')}
						value={reminderAt}
						onChange={setReminderAt}
						valueFormat='DD.MM.YYYY HH:mm'
						clearable
					/>

					<div>
						<Text size='sm' fw={500} mb={4}>
							{t('common.description')}
						</Text>
						<Suspense fallback={<Skeleton height={200} />}>
							<ExtensiveEditor
								ref={editorRef}
								onReady={() => setEditorReady(true)}
								initialMode='visual-editor'
								placeholder={t('tasks.enterDescription')}
								initialTheme={editorTheme}
								availableModes={['visual-editor', 'markdown']}
							/>
						</Suspense>
					</div>

					<Group
						justify='space-between'
						bg='var(--mantine-color-body)'
						py='md'
						px='lg'
						style={{
							position: 'fixed',
							bottom: 0,
							left: 0,
							right: 0,
							borderTop: '1px solid var(--mantine-color-default-border)',
							zIndex: 1000,
						}}
					>
						<Button
							variant='default'
							onClick={() =>
								navigate({
									to: isEdit ? ROUTES.TASK_DETAIL : ROUTES.TASKS,
									...(isEdit ? { params: { id: String(id) } } : {}),
								})
							}
						>
							{t('common.cancel')}
						</Button>
						<Button type='submit'>{isEdit ? t('common.save') : t('common.create')}</Button>
					</Group>
				</Stack>
			</form>
		</Container>
	)
}
