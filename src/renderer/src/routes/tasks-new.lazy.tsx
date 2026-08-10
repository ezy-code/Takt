import { createLazyRoute } from '@tanstack/react-router'
import { TaskPage } from '../components/TaskPage'
import { ROUTES } from '../routes'

export const Route = createLazyRoute(ROUTES.TASKS_NEW)({
	component: () => <TaskPage mode='create' />,
})
