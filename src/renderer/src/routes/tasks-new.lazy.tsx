import { createLazyRoute } from '@tanstack/react-router'
import { TaskForm } from '../components/TaskForm'
import { ROUTES } from '../routes'

export const Route = createLazyRoute(ROUTES.TASKS_NEW)({
	component: () => <TaskForm />,
})
