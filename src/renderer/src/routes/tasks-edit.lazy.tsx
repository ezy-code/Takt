import { createLazyRoute, useParams } from '@tanstack/react-router'
import { TaskPage } from '../components/TaskPage'
import { ROUTES } from '../routes'

function EditPage() {
	const { id } = useParams({ from: ROUTES.TASK_EDIT })
	return <TaskPage id={Number(id)} mode='edit' />
}

export const Route = createLazyRoute(ROUTES.TASK_EDIT)({
	component: EditPage,
})
