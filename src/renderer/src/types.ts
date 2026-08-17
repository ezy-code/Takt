import type { Api } from '../../shared/api'

export type {
	ActiveTimerInfo,
	Api,
	EntitySummary,
	EntityType,
	Group,
	Item,
	StartTimerResult,
	Status,
	TimeEntry,
	TimeEntryWithItem,
	TimeSummary,
} from '../../shared/api'

declare global {
	interface Window {
		api: Api
	}
}
