import { createLazyRoute, useParams } from '@tanstack/react-router'
import { TaskPage } from '../components/TaskPage'
import { ROUTES } from '../routes'

function TaskDetailPage() {
	const { id } = useParams({ from: ROUTES.TASK_DETAIL })
	return <TaskPage id={Number(id)} mode='view' />
}

export const Route = createLazyRoute(ROUTES.TASK_DETAIL)({
	component: TaskDetailPage,
})
