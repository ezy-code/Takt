import { createLazyRoute, useParams } from '@tanstack/react-router'
import { ProjectForm } from '../components/ProjectForm'
import { ROUTES } from '../routes'

function EditProjectPage() {
	const { id } = useParams({ from: ROUTES.PROJECT_EDIT })
	return <ProjectForm id={Number(id)} />
}

export const Route = createLazyRoute(ROUTES.PROJECT_EDIT)({
	component: EditProjectPage,
})
