import { ipcMain } from 'electron'
import { desc, eq, sql, count, asc } from 'drizzle-orm'
import { app } from 'electron'
import { join } from 'path'
import { createDb } from './db'
import { tasks, timeEntries, statuses } from './db/schema'

let db: ReturnType<typeof createDb>

export type TimerChangeInfo =
  | { active: false }
  | { active: true; startTime: string; taskName: string }

export function initDatabase(onTimerChange?: (info: TimerChangeInfo) => void) {
  const dbPath = join(app.getPath('userData'), 'tasks.db')
  db = createDb(dbPath)

  const initialActive = db
    .select()
    .from(timeEntries)
    .where(sql`${timeEntries.stopTime} is null`)
    .limit(1)
    .all()[0]

  if (initialActive) {
    const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, initialActive.taskId)).get()
    onTimerChange?.({ active: true, startTime: initialActive.startTime, taskName: task?.name ?? 'Unknown' })
  } else {
    onTimerChange?.({ active: false })
  }

  ipcMain.handle('get-statuses', () => {
    return db.select().from(statuses).orderBy(asc(statuses.position)).all()
  })

  ipcMain.handle('add-status', (_event, name: string, color: string) => {
    const maxPos = db
      .select({ maxPos: sql<number>`coalesce(max(${statuses.position}), -1)` })
      .from(statuses)
      .get()
    return db.insert(statuses).values({ name, color, position: maxPos!.maxPos + 1 }).returning().get()
  })

  ipcMain.handle('update-status', (_event, id: number, name: string, color: string) => {
    return db.update(statuses).set({ name, color }).where(eq(statuses.id, id)).returning().get()
  })

  ipcMain.handle('delete-status', (_event, id: number) => {
    const count = db.select({ cnt: sql<number>`count(*)` }).from(tasks).where(eq(tasks.statusId, id)).get()
    if (count!.cnt > 0) return { success: false, reason: 'Has tasks' }
    db.delete(statuses).where(eq(statuses.id, id)).run()
    return { success: true }
  })

  ipcMain.handle('reorder-statuses', (_event, ids: number[]) => {
    db.transaction(() => {
      ids.forEach((id, idx) => {
        db.update(statuses).set({ position: idx }).where(eq(statuses.id, id)).run()
      })
    })
    return { success: true }
  })

  ipcMain.handle('move-task', (_event, taskId: number, statusId: number) => {
    return db.update(tasks).set({ statusId }).where(eq(tasks.id, taskId)).returning().get()
  })

  ipcMain.handle('get-tasks', () => {
    return db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        description_md: tasks.descriptionMarkdown,
        description_html: tasks.descriptionHtml,
        statusId: tasks.statusId,
        today_date: tasks.today_date,
        created_at: tasks.created_at,
        total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .groupBy(tasks.id)
      .orderBy(desc(tasks.created_at))
      .all()
  })

  ipcMain.handle('get-task', (_event, id: number) => {
    return db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        description_md: tasks.descriptionMarkdown,
        description_html: tasks.descriptionHtml,
        statusId: tasks.statusId,
        today_date: tasks.today_date,
        created_at: tasks.created_at,
        total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .where(eq(tasks.id, id))
      .groupBy(tasks.id)
      .get()
  })

  ipcMain.handle('add-task', (_event, name: string, description: string, description_md?: string, description_html?: string, statusId?: number) => {
    return db.insert(tasks).values({ name, description, descriptionMarkdown: description_md ?? '', descriptionHtml: description_html ?? '', statusId }).returning().get()
  })

  ipcMain.handle('update-task', (_event, id: number, name: string, description: string, description_md?: string, description_html?: string, statusId?: number) => {
    return db.update(tasks).set({ name, description, descriptionMarkdown: description_md ?? '', descriptionHtml: description_html ?? '', statusId }).where(eq(tasks.id, id)).returning().get()
  })

  ipcMain.handle('delete-task', (_event, id: number) => {
    db.delete(timeEntries).where(eq(timeEntries.taskId, id)).run()
    db.delete(tasks).where(eq(tasks.id, id)).run()
    return { success: true }
  })

  ipcMain.handle('get-active-timer', () => {
    const entry = db
      .select()
      .from(timeEntries)
      .where(sql`${timeEntries.stopTime} is null`)
      .limit(1)
      .all()[0]

    if (!entry) return null

    const task = db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        description_md: tasks.descriptionMarkdown,
        description_html: tasks.descriptionHtml,
        statusId: tasks.statusId,
        created_at: tasks.created_at,
        total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .where(eq(tasks.id, entry.taskId))
      .groupBy(tasks.id)
      .get()

    return { entry, task }
  })

  ipcMain.handle('start-timer', (_event, taskId: number) => {
    const active = db
      .select()
      .from(timeEntries)
      .where(sql`${timeEntries.stopTime} is null`)
      .limit(1)
      .all()[0]

    if (active) {
      const activeTask = db.select().from(tasks).where(eq(tasks.id, active.taskId)).get()
      return { conflict: true, activeEntry: active, activeTask }
    }

    const now = new Date().toISOString()
    const entry = db
      .insert(timeEntries)
      .values({ taskId, startTime: now })
      .returning()
      .get()

    const task = db.select({ name: tasks.name }).from(tasks).where(eq(tasks.id, taskId)).get()
    onTimerChange?.({ active: true, startTime: now, taskName: task?.name ?? 'Unknown' })
    return { conflict: false, entry }
  })

  ipcMain.handle('stop-timer', (_event, taskId: number) => {
    const active = db
      .select()
      .from(timeEntries)
      .where(sql`${timeEntries.stopTime} is null and ${timeEntries.taskId} = ${taskId}`)
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
    return entry
  })

  ipcMain.handle('get-all-time-entries', () => {
    return db
      .select({
        id: timeEntries.id,
        taskId: timeEntries.taskId,
        taskName: tasks.name,
        startTime: timeEntries.startTime,
        stopTime: timeEntries.stopTime,
        duration: timeEntries.duration,
      })
      .from(timeEntries)
      .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .orderBy(desc(timeEntries.startTime))
      .all()
  })

  ipcMain.handle('get-time-summary', () => {
    const total = db
      .select({
        totalSessions: count(),
        totalDuration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(timeEntries)
      .get()

    const today = db
      .select({
        todayDuration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(timeEntries)
      .where(sql`date(${timeEntries.startTime}) = date('now')`)
      .get()

    return { ...total, ...today }
  })

  ipcMain.handle('delete-time-entry', (_event, id: number) => {
    db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
    return { success: true }
  })

  ipcMain.handle('toggle-today', (_event, id: number) => {
    const task = db.select({ today_date: tasks.today_date }).from(tasks).where(eq(tasks.id, id)).get()
    const newDate = task?.today_date === new Date().toISOString().split('T')[0] ? null : new Date().toISOString().split('T')[0]
    db.update(tasks).set({ today_date: newDate }).where(eq(tasks.id, id)).run()
    return { success: true }
  })

  ipcMain.handle('get-today-tasks', () => {
    return db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        description_md: tasks.descriptionMarkdown,
        description_html: tasks.descriptionHtml,
        statusId: tasks.statusId,
        today_date: tasks.today_date,
        created_at: tasks.created_at,
        total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .where(sql`${tasks.today_date} is not null`)
      .groupBy(tasks.id)
      .orderBy(desc(tasks.created_at))
      .all()
  })

  ipcMain.handle('clear-today-date', (_event, id: number) => {
    db.update(tasks).set({ today_date: null }).where(eq(tasks.id, id)).run()
    return { success: true }
  })
}
