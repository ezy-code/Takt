import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import { Button, Container, Group, Select, Stack, Text, TextInput, Title, useMantineColorScheme } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useAddTask, useProjects, useStatuses, useTask, useUpdateTask } from '../api'
import { ROUTES } from '../routes'
import { MyDayControl } from './MyDayControl'

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
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const isEdit = id != null
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

	useEffect(() => {
		if (isEdit && task) {
			setStatusId(task.statusId ?? null)
			setProjectId(task.projectId ?? null)
			setAddToMyDay(!!task.my_day_date)
		} else if (!isEdit && statuses) {
			const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]
			setStatusId(defaultStatus?.id ?? null)
			setProjectId(null)
			setAddToMyDay(false)
		}
	}, [isEdit, task, statuses])

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
			}
			if (isEdit) {
				await updateTask.mutateAsync({ id, ...payload })
				navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
			} else {
				await addTask.mutateAsync(payload)
				navigate({ to: ROUTES.TASKS })
			}
		},
	})

	useEffect(() => {
		if (isEdit && task) {
			form.setFieldValue('name', task.name)
		}
	}, [isEdit, task, form])

	if (isEdit && isLoading)
		return (
			<Container fluid py='xl'>
				<Text c='dimmed'>Loading...</Text>
			</Container>
		)
	if (isEdit && !task)
		return (
			<Container fluid py='xl'>
				<Text c='red'>Task not found</Text>
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
				{isEdit ? 'Edit Task' : 'New Task'}
			</Title>
			<form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
				<Stack>
					<form.Field name='name'>
						{(field) => (
							<TextInput
								label='Name'
								placeholder='Enter task name'
								value={field.state.value}
								onChange={(e) => field.handleChange(e.currentTarget.value)}
								data-autofocus
								required
							/>
						)}
					</form.Field>

					<Select
						label='Status'
						placeholder='Select status'
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
						label='Project'
						placeholder='Select project'
						clearable
						data={projectOptions}
						value={projectId != null ? String(projectId) : null}
						onChange={(value) => setProjectId(value ? Number(value) : null)}
						disabled={!projects?.length}
					/>

					<MyDayControl variant='button' inMyDay={addToMyDay} onToggle={() => setAddToMyDay((v) => !v)} />

					<div>
						<Text size='sm' fw={500} mb={4}>
							Description
						</Text>
						<ExtensiveEditor
							ref={editorRef}
							defaultContent={task?.description ?? ''}
							initialMode='visual-editor'
							placeholder='Enter task description (optional)'
							initialTheme={editorTheme}
							availableModes={['visual-editor', 'markdown']}
							slashCommandVisibility
						/>
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
							Cancel
						</Button>
						<Button type='submit'>{isEdit ? 'Save' : 'Create'}</Button>
					</Group>
				</Stack>
			</form>
		</Container>
	)
}
