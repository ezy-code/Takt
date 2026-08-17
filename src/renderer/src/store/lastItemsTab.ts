// Last active Items tab (list/kanban/canvas), so Back from a item page returns to context.
export let lastItemsTab: string = 'list'
export function setLastItemsTab(tab: string) {
	lastItemsTab = tab
}
