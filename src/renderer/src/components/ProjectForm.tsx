import { ExtensiveEditor, type ExtensiveEditorRef } from '@lyfie/luthor'
import {
	Button,
	Container,
	Group,
	NumberInput,
	Stack,
	Text,
	TextInput,
	Title,
	useMantineColorScheme,
} from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddProject, useProject, useUpdateProject } from '../api'
import { ROUTES } from '../routes'

function preventEditorSubmit(e: FormEvent<HTMLFormElement>, submit: () => void) {
	e.preventDefault()
	const submitter = (e.nativeEvent as SubmitEvent).submitter
	if (submitter && submitter.getAttribute('type') !== 'submit') return
	submit()
}

interface ProjectFormProps {
	id?: number
}

export function ProjectForm({ id }: ProjectFormProps) {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const editorRef = useRef<ExtensiveEditorRef>(null)
	const isEdit = id != null
	const { colorScheme } = useMantineColorScheme()
	const editorTheme =
		colorScheme === 'auto'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: colorScheme

	const { data: project, isLoading } = useProject(id ?? 0)
	const addProject = useAddProject()
	const updateProject = useUpdateProject()
	const [hourlyRate, setHourlyRate] = useState<number | string>('')

	const form = useForm({
		defaultValues: { name: '' },
		onSubmit: async ({ value }) => {
			if (!value.name.trim()) return
			const editor = editorRef.current
			const description = editor?.getJSON() ?? ''
			const description_md = editor?.getMarkdown() ?? ''
			const description_html = editor?.getHTML() ?? ''
			const hourlyRatePayload = hourlyRate === '' ? null : Number(hourlyRate)
			if (isEdit) {
				await updateProject.mutateAsync({
					id: id!,
					name: value.name.trim(),
					description,
					description_md,
					description_html,
					hourlyRate: hourlyRatePayload,
				})
				navigate({ to: ROUTES.PROJECTS })
			} else {
				await addProject.mutateAsync({
					name: value.name.trim(),
					description,
					description_md,
					description_html,
					hourlyRate: hourlyRatePayload,
				})
				navigate({ to: ROUTES.PROJECTS })
			}
		},
	})

	useEffect(() => {
		if (isEdit && project) {
			form.setFieldValue('name', project.name)
			setHourlyRate(project.hourly_rate ?? '')
		}
	}, [isEdit, project, form])

	if (isEdit && isLoading)
		return (
			<Container fluid py='xl'>
				<Text c='dimmed'>{t('common.loading')}</Text>
			</Container>
		)
	if (isEdit && !project)
		return (
			<Container fluid py='xl'>
				<Text c='red'>{t('projects.notFound')}</Text>
			</Container>
		)

	return (
		<Container fluid py='xl' pb={90}>
			<Title order={1} mb='lg'>
				{isEdit ? t('projects.editTitle') : t('projects.newTitle')}
			</Title>
			<form onSubmit={(e) => preventEditorSubmit(e, () => form.handleSubmit())}>
				<Stack>
					<form.Field name='name'>
						{(field) => (
							<TextInput
								label={t('common.name')}
								placeholder={t('projects.enterName')}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.currentTarget.value)}
								data-autofocus
								required
							/>
						)}
					</form.Field>

					<NumberInput
						label={t('projects.hourlyRate')}
						value={hourlyRate}
						onChange={(v) => setHourlyRate(v)}
						hideControls
					/>

					<div>
						<Text size='sm' fw={500} mb={4}>
							{t('common.description')}
						</Text>
						<ExtensiveEditor
							ref={editorRef}
							defaultContent={project?.description ?? ''}
							initialMode='visual-editor'
							placeholder={t('projects.enterDescription')}
							initialTheme={editorTheme}
							availableModes={['visual-editor', 'markdown']}
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
						<Button variant='default' onClick={() => navigate({ to: ROUTES.PROJECTS })}>
							{t('common.cancel')}
						</Button>
						<Button type='submit'>{isEdit ? t('common.save') : t('common.create')}</Button>
					</Group>
				</Stack>
			</form>
		</Container>
	)
}
