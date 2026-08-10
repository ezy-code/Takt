import { Box, Group } from '@mantine/core'
import type { ReactNode } from 'react'

const PILL_STYLE = { borderRadius: 999, background: 'var(--mantine-color-default-light)' } as const

interface PropertyPillProps {
	leading?: ReactNode
	color?: string
	onClick?: () => void
	children: ReactNode
}

export function PropertyPill({ leading, color, children, onClick }: PropertyPillProps) {
	return (
		<Group
			gap={5}
			align='center'
			wrap='nowrap'
			px={8}
			py={3}
			w='100%'
			mih={30}
			style={{ ...PILL_STYLE, cursor: onClick ? 'pointer' : undefined }}
			c={color}
			onClick={onClick}
		>
			{leading && (
				<Box w={14} h={14} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
					{leading}
				</Box>
			)}
			{children}
		</Group>
	)
}
