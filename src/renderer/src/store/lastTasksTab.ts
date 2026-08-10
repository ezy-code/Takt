// Last active Tasks tab (list/kanban/canvas), so Back from a task page returns to context.
export let lastTasksTab: string = 'list'
export function setLastTasksTab(tab: string) {
	lastTasksTab = tab
}
