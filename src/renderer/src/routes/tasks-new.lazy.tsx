import { createLazyRoute, useSearch } from '@tanstack/react-router'
import { TaskPage } from '../components/TaskPage'
import { ROUTES } from '../routes'

export const Route = createLazyRoute(ROUTES.TASKS_NEW)({
	component: () => {
		const { parentId, entityType } = useSearch({ from: ROUTES.TASKS_NEW })
		return <TaskPage mode='create' initialParentId={parentId} initialEntityType={entityType} />
	},
})
