import { useCallback, useEffect, useState } from 'react'
import type { UpdaterState } from '../../../shared/updater'

const initialState: UpdaterState = { status: 'idle', currentVersion: '' }

export function useUpdater() {
	const [state, setState] = useState<UpdaterState>(initialState)

	useEffect(() => {
		let mounted = true
		window.api.getUpdaterState().then((s) => {
			if (mounted) setState(s)
		})
		const unsubscribe = window.api.onUpdaterStatus(setState)
		return () => {
			mounted = false
			unsubscribe()
		}
	}, [])

	const check = useCallback(() => {
		window.api.checkForUpdates()
	}, [])

	const download = useCallback(() => {
		window.api.downloadUpdate()
	}, [])

	const restart = useCallback(() => {
		window.api.installUpdate()
	}, [])

	return { state, check, download, restart }
}
