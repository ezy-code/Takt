import { createRouter, createRootRoute, createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import AppLayout from './components/AppLayout'

const rootRoute = createRootRoute({
  component: AppLayout
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
}).lazy(() => import('./routes/tasks.lazy').then((d) => d.Route))

const tasksNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/new',
}).lazy(() => import('./routes/tasks-new.lazy').then((d) => d.Route))

const todayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/today',
}).lazy(() => import('./routes/today.lazy').then((d) => d.Route))

const timeEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/time-entries',
}).lazy(() => import('./routes/time-entries.lazy').then((d) => d.Route))

function IndexRedirect() {
  const navigate = useNavigate()
  useEffect(() => { navigate({ to: '/tasks' }) }, [])
  return null
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect
})

const routeTree = rootRoute.addChildren([indexRoute, tasksRoute, tasksNewRoute, todayRoute, timeEntriesRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
