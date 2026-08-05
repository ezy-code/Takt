import { Button, Menu } from '@mantine/core'
import { IconSun } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface MyDayControlProps {
	inMyDay: boolean
	onToggle: () => void
	variant: 'menu-item' | 'button'
}

export function MyDayControl({ inMyDay, onToggle, variant }: MyDayControlProps) {
	const { t } = useTranslation()
	const label = inMyDay ? t('myDay.remove') : t('myDay.add')
	if (variant === 'menu-item') {
		return (
			<Menu.Item leftSection={<IconSun size={14} />} onClick={onToggle} color={inMyDay ? 'red' : undefined}>
				{label}
			</Menu.Item>
		)
	}
	return (
		<Button
			variant={inMyDay ? 'light' : 'filled'}
			color={inMyDay ? 'red' : undefined}
			leftSection={<IconSun size={16} />}
			onClick={onToggle}
		>
			{label}
		</Button>
	)
}
