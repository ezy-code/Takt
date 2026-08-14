import { Button, Group, Select } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useTaskFilters } from '../hooks/useTaskFilters'

export function TaskFilters() {
	const { t } = useTranslation()
	const {
		projectFilter,
		groupFilter,
		statusFilter,
		setProjectFilter,
		setGroupFilter,
		setStatusFilter,
		reset,
		projectOptions,
		groupOptions,
		statusOptions,
	} = useTaskFilters()
	return (
		<Group mb='md'>
			<Select
				label={t('tasks.filterByProject')}
				placeholder={t('tasks.allProjects')}
				clearable
				data={projectOptions}
				value={projectFilter}
				onChange={setProjectFilter}
				w={280}
			/>
			<Select
				label={t('tasks.filterByGroup')}
				placeholder={t('tasks.allGroups')}
				clearable
				data={groupOptions}
				value={groupFilter}
				onChange={setGroupFilter}
				w={280}
			/>
			<Select
				label={t('tasks.filterByStatus')}
				placeholder={t('tasks.allStatuses')}
				clearable
				data={statusOptions}
				value={statusFilter}
				onChange={setStatusFilter}
				w={280}
			/>
			{(projectFilter != null || groupFilter != null || statusFilter != null) && (
				<Button variant='default' mt={22} onClick={reset}>
					{t('common.reset')}
				</Button>
			)}
		</Group>
	)
}
