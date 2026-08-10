import { Button, Group, Modal, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDeleteModalProps {
	opened: boolean
	onClose: () => void
	onConfirm: () => void
	title?: string
	message?: ReactNode
	confirmLabel?: string
	loading?: boolean
}

export function ConfirmDeleteModal({
	opened,
	onClose,
	onConfirm,
	title,
	message,
	confirmLabel,
	loading,
}: ConfirmDeleteModalProps) {
	const { t } = useTranslation()
	return (
		<Modal opened={opened} onClose={onClose} title={title ?? t('common.delete')} centered>
			{message != null && <Text>{message}</Text>}
			<Group justify='flex-end' mt='lg'>
				<Button variant='default' onClick={onClose} disabled={loading}>
					{t('common.cancel')}
				</Button>
				<Button color='red' onClick={onConfirm} loading={loading}>
					{confirmLabel ?? t('common.delete')}
				</Button>
			</Group>
		</Modal>
	)
}

export function useConfirmDelete(opts: Omit<ConfirmDeleteModalProps, 'opened' | 'onClose' | 'onConfirm'> = {}) {
	const [opened, setOpened] = useState(false)
	const action = useRef<(() => void) | null>(null)

	const confirm = (fn: () => void) => {
		action.current = fn
		setOpened(true)
	}

	const modal = (
		<ConfirmDeleteModal
			{...opts}
			opened={opened}
			onClose={() => setOpened(false)}
			onConfirm={() => {
				setOpened(false)
				action.current?.()
			}}
		/>
	)

	return [modal, confirm] as const
}
