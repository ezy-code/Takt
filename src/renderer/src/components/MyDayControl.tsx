import { Group, Menu, Text, Tooltip } from '@mantine/core'
import { IconSun } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface MyDayControlProps {
	inMyDay: boolean
	onToggle: () => void
	variant?: 'menu-item' | 'button'
	fullWidth?: boolean
	overdue?: boolean
}

export function MyDayControl({ inMyDay, onToggle, variant = 'button', fullWidth, overdue }: MyDayControlProps) {
	const { t } = useTranslation()
	const color = overdue ? 'red' : inMyDay ? 'blue' : 'dimmed'
	if (variant === 'menu-item') {
		return (
			<Menu.Item leftSection={<IconSun size={14} />} color={color} onClick={onToggle}>
				{t('myDay.title')}
			</Menu.Item>
		)
	}
	return (
		<Tooltip label={overdue || !inMyDay ? t('myDay.add') : t('myDay.remove')}>
			<Group
				gap={5}
				align='center'
				px={6}
				py={2}
				w={fullWidth ? '100%' : undefined}
				c={color}
				onClick={onToggle}
				style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)', cursor: 'pointer' }}
			>
				<IconSun size={14} />
				<Text size='xs'>{t('myDay.title')}</Text>
			</Group>
		</Tooltip>
	)
}
