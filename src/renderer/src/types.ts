import type { Api } from '../../shared/api'

export type {
	ActiveTimerInfo,
	Api,
	CanvasGroup,
	Project,
	StartTimerResult,
	Status,
	Task,
	TimeEntry,
	TimeEntryWithTask,
	TimeSummary,
} from '../../shared/api'

declare global {
	interface Window {
		api: Api
	}
}
