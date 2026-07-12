import { ipcMain } from 'electron'
import { desc, eq, sql, count } from 'drizzle-orm'
import { app } from 'electron'
import { join } from 'path'
import { createDb } from './db'
import { tasks, timeEntries } from './db/schema'

let db: ReturnType<typeof createDb>

export function initDatabase(onTimerChange?: (active: boolean) => void) {
  const dbPath = join(app.getPath('userData'), 'tasks.db')
  db = createDb(dbPath)

  const initialActive = db
    .select()
    .from(timeEntries)
    .where(sql`${timeEntries.stopTime} is null`)
    .limit(1)
    .all()[0]

  onTimerChange?.(!!initialActive)

  ipcMain.handle('get-tasks', () => {
    return db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
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

  ipcMain.handle('add-task', (_event, name: string, description: string) => {
    return db.insert(tasks).values({ name, description }).returning().get()
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

    onTimerChange?.(true)
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

    onTimerChange?.(false)
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
