import { createLazyRoute } from '@tanstack/react-router'
import { ProjectForm } from '../components/ProjectForm'
import { ROUTES } from '../routes'

export const Route = createLazyRoute(ROUTES.PROJECTS_NEW)({
	component: () => <ProjectForm />,
})
