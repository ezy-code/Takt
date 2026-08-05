import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
	main: {
		build: {
			externalizeDeps: true,
			rollupOptions: {
				external: ['electron', 'better-sqlite3'],
			},
		},
	},
	preload: {
		build: {
			externalizeDeps: true,
		},
	},
	renderer: {
		plugins: [react()],
	},
})
