import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@lyfie/luthor/styles.css'
import './highlight.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routeTree'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider defaultColorScheme='dark'>
				<RouterProvider router={router} />
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>,
)
