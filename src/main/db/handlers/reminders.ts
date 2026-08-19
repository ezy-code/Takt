import { eq, sql } from 'drizzle-orm'
import { app, BrowserWindow, Notification } from 'electron'
import { META_LANGUAGE_KEY } from '../../../shared/constants'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { appMeta, items } from '../schema'

function showItemReminderNotification(db: Db, item: { id: number; name: string }) {
	const savedLang = db
		.select({ value: appMeta.value })
		.from(appMeta)
		.where(eq(appMeta.key, META_LANGUAGE_KEY))
		.get()?.value
	const isRu = savedLang === 'ru' || (!savedLang && app.getLocale().startsWith('ru'))
	const notification = new Notification({
		title: item.name,
		body: isRu ? '⏰ Напоминание' : '⏰ Reminder',
	})
	notification.on('click', () => {
		const win = BrowserWindow.getAllWindows()[0]
		if (!win) return
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
		win.webContents.send(IPC.NAVIGATE_TO_ITEM, item.id)
	})
	notification.show()
}

// ponytail: in-memory notified set, resets on restart — a reminder still inside the
// fire window re-fires once on launch (desired). Laptop sleep through the
// window can skip a reminder; persist a `notified` flag in the DB if that ever matters.
export function startReminderPoller(db: Db) {
	const notifiedReminders = new Set<number>()
	setInterval(() => {
		const now = Date.now()
		const reminderItems = db
			.select({ id: items.id, name: items.name, reminderAt: items.reminderAt })
			.from(items)
			.where(sql`${items.reminderAt} is not null`)
			.all()
		for (const item of reminderItems) {
			if (!item.reminderAt || notifiedReminders.has(item.id)) continue
			const remindAt = new Date(item.reminderAt).getTime()
			if (remindAt - now > 20_000 || remindAt - now <= -10_000) continue
			notifiedReminders.add(item.id)
			showItemReminderNotification(db, item)
		}
	}, 20_000)
}
