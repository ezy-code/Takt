import { createRouter, createRootRoute, createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import AppLayout from './components/AppLayout'

import { ROUTES } from './routes'

const rootRoute = createRootRoute({
  component: AppLayout
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TASKS,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'list',
  }),
}).lazy(() => import('./routes/tasks.lazy').then((d) => d.Route))

const tasksNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TASKS_NEW,
}).lazy(() => import('./routes/tasks-new.lazy').then((d) => d.Route))

const taskDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TASK_DETAIL,
}).lazy(() => import('./routes/task-detail.lazy').then((d) => d.Route))

const taskEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TASK_EDIT,
}).lazy(() => import('./routes/tasks-edit.lazy').then((d) => d.Route))

const todayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TASKS_TODAY,
}).lazy(() => import('./routes/today.lazy').then((d) => d.Route))

const timeEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIME_ENTRIES,
}).lazy(() => import('./routes/time-entries.lazy').then((d) => d.Route))

function IndexRedirect() {
  const navigate = useNavigate()
  useEffect(() => { navigate({ to: ROUTES.TASKS }) }, [])
  return null
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.INDEX,
  component: IndexRedirect
})

const routeTree = rootRoute.addChildren([indexRoute, tasksRoute, tasksNewRoute, taskDetailRoute, taskEditRoute, todayRoute, timeEntriesRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
