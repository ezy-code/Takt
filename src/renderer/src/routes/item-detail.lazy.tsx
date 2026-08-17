import { createLazyRoute, useParams } from '@tanstack/react-router'
import { ItemPage } from '../components/ItemPage'
import { ROUTES } from '../routes'

function ItemDetailPage() {
	const { id } = useParams({ from: ROUTES.ITEM_DETAIL })
	return <ItemPage id={Number(id)} mode='view' />
}

export const Route = createLazyRoute(ROUTES.ITEM_DETAIL)({
	component: ItemDetailPage,
})
