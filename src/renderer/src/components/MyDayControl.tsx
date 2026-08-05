import { Button, Menu } from '@mantine/core'
import { IconSun } from '@tabler/icons-react'

interface MyDayControlProps {
	inMyDay: boolean
	onToggle: () => void
	variant: 'menu-item' | 'button'
}

export function MyDayControl({ inMyDay, onToggle, variant }: MyDayControlProps) {
	if (variant === 'menu-item') {
		return (
			<Menu.Item leftSection={<IconSun size={14} />} onClick={onToggle} color={inMyDay ? 'red' : undefined}>
				{inMyDay ? 'Remove from My Day' : 'Add to My Day'}
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
			{inMyDay ? 'Remove from My Day' : 'Add to My Day'}
		</Button>
	)
}
