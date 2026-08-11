import { Button, type ButtonProps } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDeleteButtonProps extends Omit<ButtonProps, 'onClick'> {
	onConfirm: () => void
	confirmLabel?: string
}

export function ConfirmDeleteButton({
	onConfirm,
	confirmLabel,
	disabled,
	loading,
	...props
}: ConfirmDeleteButtonProps) {
	const { t } = useTranslation()
	const [confirming, setConfirming] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	useEffect(() => () => clearTimeout(timer.current), [])

	const arm = () => {
		setConfirming(true)
		clearTimeout(timer.current)
		timer.current = setTimeout(() => setConfirming(false), 2500)
	}

	const fire = () => {
		clearTimeout(timer.current)
		setConfirming(false)
		onConfirm()
	}

	if (confirming) {
		return (
			<Button color='red' variant='filled' loading={loading} disabled={disabled} onClick={fire} {...props}>
				{confirmLabel ?? t('common.confirmDelete')}
			</Button>
		)
	}

	return (
		<Button color='red' variant='outline' disabled={disabled || loading} onClick={arm} {...props}>
			{t('common.delete')}
		</Button>
	)
}
