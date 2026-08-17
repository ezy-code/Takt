import { createLazyRoute, useParams } from '@tanstack/react-router'
import { ItemPage } from '../components/ItemPage'
import { ROUTES } from '../routes'

function EditPage() {
	const { id } = useParams({ from: ROUTES.ITEM_EDIT })
	return <ItemPage id={Number(id)} mode='edit' />
}

export const Route = createLazyRoute(ROUTES.ITEM_EDIT)({
	component: EditPage,
})
