import { Group, Menu, Text, UnstyledButton } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useMoveItem, useStatuses } from '../api'
import type { Status } from '../types'

type StatusSize = 'xs' | 'sm'

const DOT_SIZES: Record<StatusSize, number> = { xs: 8, sm: 10 }

/** Colored round dot used as the status indicator. */
export function StatusDot({ color, size = 'sm' }: { color: string; size?: StatusSize }) {
	return (
		<div
			style={{
				width: DOT_SIZES[size],
				height: DOT_SIZES[size],
				borderRadius: '50%',
				backgroundColor: color,
				flexShrink: 0,
			}}
		/>
	)
}

interface StatusBadgeProps {
	status: Pick<Status, 'id' | 'name' | 'color'>
	size?: StatusSize
	/** Dim the status name (used on the canvas where space is tight). */
	dimmed?: boolean
	/** Truncate long names with an ellipsis. */
	ellipsis?: boolean
	/** Item this status belongs to; used to persist the change directly. */
	itemId?: number
	/** Called when a different status is picked (used for form-bound editing). */
	onStatusChange?: (statusId: number) => void
	/** Allow changing the status by opening a picker menu. Defaults to true. */
	editable?: boolean
	/** Extra class for the interactive picker target (e.g. `nodrag` on the canvas). */
	className?: string
}

/** Colored dot + status name; when editable, clicking opens a menu to change the status. */
export function StatusBadge({
	status,
	size = 'xs',
	dimmed = false,
	ellipsis = false,
	itemId,
	onStatusChange,
	editable = true,
	className,
}: StatusBadgeProps) {
	const { t } = useTranslation()
	const { data: statuses } = useStatuses()
	const moveItem = useMoveItem()
	// Persist directly when an item is given, otherwise report via callback (form editing).
	const interactive = editable && (itemId != null || onStatusChange != null)

	const handlePick = (statusId: number) => {
		if (statusId === status.id) return
		if (itemId != null) moveItem.mutate({ itemId, statusId })
		else onStatusChange?.(statusId)
	}

	const content = (
		<Group gap={5} align='center' wrap={ellipsis ? 'nowrap' : 'wrap'} style={ellipsis ? { minWidth: 0 } : undefined}>
			<StatusDot color={status.color} size={size} />
			<Text
				size={size}
				c={dimmed ? 'dimmed' : undefined}
				lh={size === 'xs' ? 1 : undefined}
				style={ellipsis ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}
			>
				{status.name}
			</Text>
		</Group>
	)

	if (!interactive) return content

	return (
		<Menu shadow='md' width={200} position='bottom-start'>
			<Menu.Target>
				<UnstyledButton
					className={className}
					disabled={moveItem.isPending || !statuses?.length}
					aria-label={t('items.selectStatus')}
					style={{
						borderRadius: 999,
						background: 'var(--mantine-color-default-light)',
						padding: '1px 8px',
						cursor: 'pointer',
						display: 'inline-flex',
						maxWidth: '100%',
					}}
				>
					{content}
				</UnstyledButton>
			</Menu.Target>
			<Menu.Dropdown>
				{(statuses ?? []).map((s) => (
					<Menu.Item
						key={s.id}
						leftSection={<StatusDot color={s.color} size='sm' />}
						rightSection={s.id === status.id ? <IconCheck size={14} /> : undefined}
						onClick={() => handlePick(s.id)}
					>
						{s.name}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	)
}
