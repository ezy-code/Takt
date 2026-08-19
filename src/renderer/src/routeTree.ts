import { createHashHistory, createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import AppLayout from './components/AppLayout'

import { ROUTES } from './routes'

const rootRoute = createRootRoute({
	component: AppLayout,
})

const itemsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.ITEMS,
	validateSearch: (search: Record<string, unknown>): { tab?: string; focusGroup?: number; focusItem?: number } => ({
		tab: (search.tab as string) || 'list',
		focusGroup: search.focusGroup != null ? Number(search.focusGroup) : undefined,
		focusItem: search.focusItem != null ? Number(search.focusItem) : undefined,
	}),
}).lazy(() => import('./routes/items.lazy').then((d) => d.Route))

const itemDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.ITEM_DETAIL,
}).lazy(() => import('./routes/item-detail.lazy').then((d) => d.Route))

const itemEditRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.ITEM_EDIT,
}).lazy(() => import('./routes/items-edit.lazy').then((d) => d.Route))

const myDayRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.MY_DAY,
}).lazy(() => import('./routes/my-day.lazy').then((d) => d.Route))

const timeEntriesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.TIME_ENTRIES,
}).lazy(() => import('./routes/time-entries.lazy').then((d) => d.Route))

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SETTINGS,
}).lazy(() => import('./routes/settings.lazy').then((d) => d.Route))

function IndexRedirect() {
	const navigate = useNavigate()
	useEffect(() => {
		navigate({ to: ROUTES.MY_DAY })
	}, [])
	return null
}

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.INDEX,
	component: IndexRedirect,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	myDayRoute,
	itemsRoute,
	itemDetailRoute,
	itemEditRoute,
	timeEntriesRoute,
	settingsRoute,
])

export const router = createRouter({ routeTree, history: createHashHistory() })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
