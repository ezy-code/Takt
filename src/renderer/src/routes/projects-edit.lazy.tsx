import { createLazyRoute, useParams } from '@tanstack/react-router'
import { TaskPage } from '../components/TaskPage'
import { ROUTES } from '../routes'

function EditProjectPage() {
	const { id } = useParams({ from: ROUTES.PROJECT_EDIT })
	return <TaskPage id={Number(id)} mode='edit' />
}

export const Route = createLazyRoute(ROUTES.PROJECT_EDIT)({
	component: EditProjectPage,
})
