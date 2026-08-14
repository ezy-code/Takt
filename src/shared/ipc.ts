// Single source of truth for the IPC channel names shared between the main
// process (handlers) and the renderer (preload bridge).
export const IPC = {
	// meta
	GET_META: 'get-meta',
	SET_META: 'set-meta',

	// projects
	GET_PROJECTS: 'get-projects',
	GET_PROJECT: 'get-project',
	ADD_PROJECT: 'add-project',
	UPDATE_PROJECT: 'update-project',

	// tasks
	GET_TASKS: 'get-tasks',
	GET_TASK: 'get-task',
	ADD_TASK: 'add-task',
	DELETE_TASK: 'delete-task',
	UPDATE_TASK: 'update-task',
	GET_MY_DAY_TASKS: 'get-my-day-tasks',
	TOGGLE_MY_DAY: 'toggle-my-day',
	CLEAR_MY_DAY: 'clear-my-day-date',
	REORDER_TASKS: 'reorder-tasks',
	MOVE_TASK: 'move-task',
	UPDATE_TASK_CANVAS_POSITION: 'update-task-canvas-position',
	GET_TASK_LINKS: 'get-task-links',
	ADD_TASK_LINK: 'add-task-link',
	DELETE_TASK_LINK: 'delete-task-link',

	// canvas groups
	GET_CANVAS_GROUPS: 'get-canvas-groups',
	ADD_CANVAS_GROUP: 'add-canvas-group',
	UPDATE_CANVAS_GROUP: 'update-canvas-group',
	DELETE_CANVAS_GROUP: 'delete-canvas-group',

	// statuses
	GET_STATUSES: 'get-statuses',
	ADD_STATUS: 'add-status',
	UPDATE_STATUS: 'update-status',
	DELETE_STATUS: 'delete-status',
	REORDER_STATUSES: 'reorder-statuses',
	SET_DEFAULT_STATUS: 'set-default-status',

	// timer / time entries
	GET_ACTIVE_TIMER: 'get-active-timer',
	GET_LAST_TIMER: 'get-last-timer',
	START_TIMER: 'start-timer',
	STOP_TIMER: 'stop-timer',
	GET_ALL_TIME_ENTRIES: 'get-all-time-entries',
	GET_TIME_SUMMARY: 'get-time-summary',
	DELETE_TIME_ENTRY: 'delete-time-entry',

	// notifications / navigation
	SHOW_NOTIFICATION: 'show-notification',
	NAVIGATE_TO_TASK: 'navigate-to-task',
	TIMER_CHANGED: 'timer-changed',

	// autostart
	GET_AUTOSTART: 'get-autostart',
	SET_AUTOSTART: 'set-autostart',

	// linux desktop entry
	APPIMAGE_GET_DESKTOP_ENTRY_STATUS: 'appimage:get-desktop-entry-status',
	APPIMAGE_SET_DESKTOP_ENTRY: 'appimage:set-desktop-entry',

	// updater
	UPDATER_GET_STATE: 'updater:get-state',
	UPDATER_CHECK: 'updater:check',
	UPDATER_DOWNLOAD: 'updater:download',
	UPDATER_INSTALL: 'updater:install',
	UPDATER_STATUS: 'updater:status',
} as const
