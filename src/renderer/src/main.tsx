import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@lyfie/luthor/styles.css'
import './highlight.css'
import { RouterProvider } from '@tanstack/react-router'
import { APP_NAME, META_ONBOARDED_KEY } from '../../shared/constants'
import Onboarding from './components/Onboarding'
import i18n, { resolveLanguage } from './i18n'
import { router } from './routeTree'

const queryClient = new QueryClient()

document.title = APP_NAME
document.documentElement.lang = i18n.resolvedLanguage ?? 'en'

function App() {
	const [onboarded, setOnboarded] = useState<boolean | null>(null)

	useEffect(() => {
		let cancelled = false
		Promise.all([window.api.getMeta(META_ONBOARDED_KEY), resolveLanguage()]).then(([value, lang]) => {
			if (cancelled) return
			i18n.changeLanguage(lang)
			setOnboarded(value === '1')
		})
		return () => {
			cancelled = true
		}
	}, [])

	if (onboarded === null) return null
	if (!onboarded) {
		return (
			<Onboarding
				onDone={() => {
					window.api.setMeta(META_ONBOARDED_KEY, '1')
					setOnboarded(true)
				}}
			/>
		)
	}
	return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider defaultColorScheme='dark'>
				<App />
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>,
)
