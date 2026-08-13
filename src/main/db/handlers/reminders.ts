import { eq, sql } from 'drizzle-orm'
import { app, BrowserWindow, Notification } from 'electron'
import { META_LANGUAGE_KEY } from '../../../shared/constants'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { appMeta, tasks } from '../schema'

function showTaskReminderNotification(db: Db, task: { id: number; name: string }) {
	const savedLang = db
		.select({ value: appMeta.value })
		.from(appMeta)
		.where(eq(appMeta.key, META_LANGUAGE_KEY))
		.get()?.value
	const isRu = savedLang === 'ru' || (!savedLang && app.getLocale().startsWith('ru'))
	const notification = new Notification({
		title: task.name,
		body: isRu ? '⏰ Напоминание' : '⏰ Reminder',
	})
	notification.on('click', () => {
		const win = BrowserWindow.getAllWindows()[0]
		if (!win) return
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
		win.webContents.send(IPC.NAVIGATE_TO_TASK, task.id)
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
		const reminderTasks = db
			.select({ id: tasks.id, name: tasks.name, reminder_at: tasks.reminderAt })
			.from(tasks)
			.where(sql`${tasks.reminderAt} is not null`)
			.all()
		for (const task of reminderTasks) {
			if (!task.reminder_at || notifiedReminders.has(task.id)) continue
			const remindAt = new Date(task.reminder_at).getTime()
			if (remindAt - now > 20_000 || remindAt - now <= -10_000) continue
			notifiedReminders.add(task.id)
			showTaskReminderNotification(db, task)
		}
	}, 20_000)
}
