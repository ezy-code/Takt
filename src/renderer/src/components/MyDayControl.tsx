import { Group, type MantineSize, Menu, Text, Tooltip } from '@mantine/core'
import { IconSun } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useClearMyDay, useToggleMyDay } from '../api'

function getMyDayState(myDayDate: string | null | undefined): 'none' | 'today' | 'overdue' {
	if (!myDayDate) return 'none'
	const today = new Date().toISOString().split('T')[0]
	return myDayDate === today ? 'today' : 'overdue'
}

interface MyDayControlProps {
	taskId?: number
	myDayDate?: string | null
	inMyDay?: boolean
	onToggle?: () => void
	variant?: 'menu-item' | 'button'
	fullWidth?: boolean
	size?: MantineSize
}

export function MyDayControl({
	taskId,
	myDayDate,
	inMyDay,
	onToggle,
	variant = 'button',
	fullWidth,
	size = 'xs',
}: MyDayControlProps) {
	const { t } = useTranslation()
	const toggleMyDay = useToggleMyDay()
	const clearMyDay = useClearMyDay()
	const state = taskId != null ? getMyDayState(myDayDate) : null
	const active = state != null ? state !== 'none' : !!inMyDay
	const overdue = state === 'overdue'
	const handleToggle = () => {
		if (taskId != null) {
			if (state === 'today') clearMyDay.mutate(taskId)
			else toggleMyDay.mutate(taskId)
		} else {
			onToggle?.()
		}
	}
	const color = overdue ? 'red' : active ? 'blue' : 'dimmed'
	if (variant === 'menu-item') {
		return (
			<Menu.Item leftSection={<IconSun size={14} />} color={color} onClick={handleToggle}>
				{t('myDay.title')}
			</Menu.Item>
		)
	}
	return (
		<Tooltip label={overdue || !active ? t('myDay.add') : t('myDay.remove')}>
			<Group
				gap={5}
				align='center'
				justify='center'
				px={6}
				py={2}
				w={fullWidth ? '100%' : undefined}
				c={color}
				onClick={handleToggle}
				style={{ borderRadius: 999, background: 'var(--mantine-color-default-light)', cursor: 'pointer' }}
			>
				<IconSun size={14} />
				<Text size={size}>{t('myDay.title')}</Text>
			</Group>
		</Tooltip>
	)
}
