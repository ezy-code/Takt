import { ActionIcon, Button, ColorInput, Group, Paper, Stack, Text, TextInput } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddStatus } from '../api'

export function AddStatusColumn() {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const [name, setName] = useState('')
	const [color, setColor] = useState('#868e96')
	const addStatus = useAddStatus()

	const handleAdd = () => {
		if (!name.trim()) return
		addStatus.mutate(
			{ name: name.trim(), color },
			{
				onSuccess: () => {
					setName('')
					setColor('#868e96')
					setIsOpen(false)
				},
			},
		)
	}

	if (!isOpen) {
		return (
			<Paper
				withBorder
				p='sm'
				onClick={() => setIsOpen(true)}
				style={{
					minWidth: 300,
					maxWidth: 300,
					borderStyle: 'dashed',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: 80,
				}}
			>
				<Group gap='xs'>
					<IconPlus size={20} />
					<Text size='sm' c='dimmed'>
						{t('statuses.addColumn')}
					</Text>
				</Group>
			</Paper>
		)
	}

	return (
		<Paper
			withBorder
			p='sm'
			style={{
				minWidth: 300,
				maxWidth: 300,
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
			}}
		>
			<Group justify='space-between'>
				<Text fw={600} size='sm'>
					{t('statuses.newColumn')}
				</Text>
				<ActionIcon variant='subtle' size='sm' onClick={() => setIsOpen(false)}>
					<IconX size={14} />
				</ActionIcon>
			</Group>
			<TextInput
				placeholder={t('statuses.namePlaceholder')}
				value={name}
				onChange={(e) => setName(e.currentTarget.value)}
				size='sm'
				data-autofocus
			/>
			<ColorInput size='sm' value={color} onChange={setColor} />
			<Button size='sm' onClick={handleAdd} loading={addStatus.isPending}>
				{t('common.add')}
			</Button>
		</Paper>
	)
}
