import { Button, Group, Pill, Popover, SegmentedControl, Select, Stack, Switch } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAdjustments } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useTaskFilters } from '../hooks/useTaskFilters'

export function TaskFilters() {
	const { t } = useTranslation()
	const [opened, { toggle, open, close }] = useDisclosure(false)
	const {
		groupFilter,
		statusFilter,
		showOnlyParents,
		entityTypeFilter,
		setGroupFilter,
		setStatusFilter,
		setShowOnlyParents,
		setEntityTypeFilter,
		reset,
		groupOptions,
		statusOptions,
	} = useTaskFilters()
	const hasFilters = groupFilter != null || statusFilter != null || showOnlyParents || entityTypeFilter != null
	const filterCount =
		[groupFilter, statusFilter, entityTypeFilter].filter((value) => value != null).length + (showOnlyParents ? 1 : 0)
	const optionLabel = (options: { value: string; label: string }[], value: string | null) =>
		options.find((option) => option.value === value)?.label ?? value

	return (
		<Stack mb='md' gap='xs'>
			<Group gap='xs' wrap='wrap'>
				<SegmentedControl
					color='blue'
					value={entityTypeFilter ?? ''}
					onChange={(value) => setEntityTypeFilter(value === '' ? null : (value as 'task' | 'note'))}
					data={[
						{ value: '', label: t('common.all') },
						{ value: 'task', label: t('entity.task') },
						{ value: 'note', label: t('entity.note') },
					]}
				/>
				{statusOptions.length > 4 ? (
					<Select
						placeholder={t('tasks.allStatuses')}
						clearable
						data={statusOptions}
						value={statusFilter}
						onChange={setStatusFilter}
						w={200}
					/>
				) : (
					<SegmentedControl
						color='blue'
						value={statusFilter ?? ''}
						onChange={(value) => setStatusFilter(value === '' ? null : value)}
						data={[{ value: '', label: t('common.all') }, ...statusOptions]}
					/>
				)}
				<Switch
					label={t('tasks.showOnlyParents')}
					checked={showOnlyParents}
					onChange={(event) => setShowOnlyParents(event.currentTarget.checked)}
				/>
				<Popover
					opened={opened}
					onChange={(value) => (value ? open() : close())}
					width={320}
					position='bottom-end'
					withArrow
				>
					<Popover.Target>
						<Button
							variant='light'
							leftSection={<IconAdjustments size={16} />}
							onClick={toggle}
							style={{ marginLeft: 'auto' }}
						>
							{t('tasks.moreFilters')}
							{hasFilters ? ` (${filterCount})` : ''}
						</Button>
					</Popover.Target>
					<Popover.Dropdown>
						<Stack gap='sm'>
							<Select
								label={t('tasks.filterByGroup')}
								placeholder={t('tasks.allGroups')}
								clearable
								data={groupOptions}
								value={groupFilter}
								onChange={setGroupFilter}
								searchable
							/>
						</Stack>
					</Popover.Dropdown>
				</Popover>
			</Group>

			<Group gap='xs' wrap='wrap'>
				<Pill.Group gap='xs'>
					{groupFilter != null && (
						<Pill size='sm' withRemoveButton onRemove={() => setGroupFilter(null)}>
							{`${t('tasks.group')}: ${optionLabel(groupOptions, groupFilter)}`}
						</Pill>
					)}
				</Pill.Group>
				{hasFilters && (
					<Button variant='subtle' size='sm' onClick={reset}>
						{t('common.reset')}
					</Button>
				)}
			</Group>
		</Stack>
	)
}
