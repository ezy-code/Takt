import { desc, eq, max, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { ActiveTimerInfo } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { getItemForTimer } from '../repositories/items'
import { items, timeEntries } from '../schema'
import type { OnTimerChange } from '../types'

export function getLastTimeEntry(db: Db): ActiveTimerInfo | null {
	const entry = db.select().from(timeEntries).orderBy(desc(timeEntries.startTime)).limit(1).all()[0]

	if (!entry) return null

	const item = getItemForTimer(db, entry.itemId)
	if (!item) return null

	return { entry, item }
}

export function getRecentItems(db: Db, limit = 5) {
	return db
		.select({ id: items.id, name: items.name })
		.from(timeEntries)
		.innerJoin(items, eq(timeEntries.itemId, items.id))
		.groupBy(items.id)
		.orderBy(desc(max(timeEntries.startTime)))
		.limit(limit)
		.all()
}

export function startTimer(db: Db, itemId: number, onTimerChange?: OnTimerChange) {
	const active = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (active) {
		const activeItem = db.select().from(items).where(eq(items.id, active.itemId)).get()
		return { conflict: true, activeEntry: active, activeItem }
	}

	const now = new Date().toISOString()
	const entry = db.insert(timeEntries).values({ itemId, startTime: now }).returning().get()

	const item = db.select({ name: items.name }).from(items).where(eq(items.id, itemId)).get()
	onTimerChange?.({ active: true, startTime: now, itemName: item?.name ?? 'Unknown', itemId })
	return { conflict: false, entry, item: getItemForTimer(db, itemId) }
}

export function stopTimer(db: Db, itemId: number, onTimerChange?: OnTimerChange) {
	const active = db
		.select()
		.from(timeEntries)
		.where(sql`${timeEntries.stopTime} is null and ${timeEntries.itemId} = ${itemId}`)
		.limit(1)
		.all()[0]

	if (!active) return null

	const now = new Date().toISOString()
	const start = new Date(active.startTime).getTime()
	const end = new Date(now).getTime()
	const duration = Math.floor((end - start) / 1000)

	const entry = db
		.update(timeEntries)
		.set({ stopTime: now, duration })
		.where(eq(timeEntries.id, active.id))
		.returning()
		.get()

	onTimerChange?.({ active: false })
	return { entry, item: getItemForTimer(db, itemId) }
}

export function registerTimerHandlers(db: Db, onTimerChange?: OnTimerChange) {
	const initialActive = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

	if (initialActive) {
		const item = db.select({ name: items.name }).from(items).where(eq(items.id, initialActive.itemId)).get()
		onTimerChange?.({
			active: true,
			startTime: initialActive.startTime,
			itemName: item?.name ?? 'Unknown',
			itemId: initialActive.itemId,
		})
	} else {
		onTimerChange?.({ active: false })
	}

	ipcMain.handle(IPC.GET_ACTIVE_TIMER, () => {
		const entry = db.select().from(timeEntries).where(sql`${timeEntries.stopTime} is null`).limit(1).all()[0]

		if (!entry) return null

		const item = getItemForTimer(db, entry.itemId)

		return { entry, item }
	})

	ipcMain.handle(IPC.GET_LAST_TIMER, () => getLastTimeEntry(db))

	ipcMain.handle(IPC.START_TIMER, (_event, itemId: number) => startTimer(db, itemId, onTimerChange))

	ipcMain.handle(IPC.STOP_TIMER, (_event, itemId: number) => stopTimer(db, itemId, onTimerChange))
}
