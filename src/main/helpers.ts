import { app } from 'electron'
import { join } from 'path'

export const getResourcePath = (rel: string): string => {
	const base = app.isPackaged ? join(process.resourcesPath, 'resources') : join(__dirname, '../../resources')
	return join(base, rel)
}
