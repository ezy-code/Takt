export type UpdaterStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdaterProgress {
	percent: number
	transferred: number
	total: number
	bytesPerSecond: number
}

export interface UpdaterState {
	status: UpdaterStatus
	currentVersion: string
	latestVersion?: string
	progress?: UpdaterProgress
	error?: string
}
