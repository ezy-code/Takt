import { registerGroupsHandlers } from './handlers/groups'
import { registerMetaHandlers } from './handlers/meta'
import { registerMyDayHandlers } from './handlers/my-day'
import { startReminderPoller } from './handlers/reminders'
import { registerStatusesHandlers } from './handlers/statuses'
import { registerTasksHandlers } from './handlers/tasks'
import { registerTimeEntriesHandlers } from './handlers/time-entries'
import { registerTimerHandlers } from './handlers/timer'
import type { Db } from './index'
import { initMetaDb } from './meta'
import type { OnTimerChange } from './types'

export function registerHandlers(db: Db, opts: { onTimerChange?: OnTimerChange } = {}) {
	initMetaDb(db)
	registerMetaHandlers()
	registerStatusesHandlers(db)
	registerTasksHandlers(db)
	registerGroupsHandlers(db)
	registerTimerHandlers(db, opts.onTimerChange)
	registerTimeEntriesHandlers(db)
	registerMyDayHandlers(db)
	startReminderPoller(db)
}
