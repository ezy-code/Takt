import { createLazyRoute, useSearch } from '@tanstack/react-router'
import { ItemPage } from '../components/ItemPage'
import { ROUTES } from '../routes'

export const Route = createLazyRoute(ROUTES.ITEMS_NEW)({
	component: () => {
		const { parentId, entityType } = useSearch({ from: ROUTES.ITEMS_NEW })
		return <ItemPage mode='create' initialParentId={parentId} initialEntityType={entityType} />
	},
})
