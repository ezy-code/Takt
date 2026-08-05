import { createLazyRoute, useParams } from '@tanstack/react-router'
import { TaskForm } from '../components/TaskForm'
import { ROUTES } from '../routes'

function EditPage() {
	const { id } = useParams({ from: ROUTES.TASK_EDIT })
	return <TaskForm id={Number(id)} />
}

export const Route = createLazyRoute(ROUTES.TASK_EDIT)({
	component: EditPage,
})
