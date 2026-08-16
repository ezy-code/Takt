import { asc, desc, eq, sql } from 'drizzle-orm'
import type { RateSource } from '../../../shared/api'
import { costOf } from '../../../shared/cost'
import type { Db } from '../index'
import { getDefaultRate } from '../meta'
import { projects, tasks, timeEntries } from '../schema'

export function resolveRate(
	taskRate: number | null | undefined,
	projectRate: number | null | undefined,
	defaultRate: number,
): { rate: number; rateSource: RateSource } {
	if (taskRate != null && Number.isFinite(taskRate)) return { rate: taskRate, rateSource: 'task' }
	if (projectRate != null && Number.isFinite(projectRate)) return { rate: projectRate, rateSource: 'project' }
	return { rate: defaultRate, rateSource: 'default' }
}

type TaskRateRow = {
	total_duration: number
	hourly_rate: number | null | undefined
	project_rate: number | null | undefined
}

function decorateTaskWithRate<T extends TaskRateRow>(row: T, defaultRate: number) {
	const { rate, rateSource } = resolveRate(row.hourly_rate, row.project_rate, defaultRate)
	return { ...row, project_rate: undefined, rate, rateSource, cost: costOf(row.total_duration ?? 0, rate) }
}

const taskRateSelect = {
	id: tasks.id,
	name: tasks.name,
	description: tasks.description,
	description_md: tasks.descriptionMarkdown,
	description_html: tasks.descriptionHtml,
	statusId: tasks.statusId,
	projectId: tasks.projectId,
	my_day_date: tasks.my_day_date,
	reminder_at: tasks.reminderAt,
	created_at: tasks.created_at,
	position: tasks.position,
	canvasX: tasks.canvasX,
	canvasY: tasks.canvasY,
	groupId: tasks.groupId,
	hourly_rate: tasks.hourly_rate,
	entityType: tasks.entityType,
	project_rate: projects.hourly_rate,
	total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
}

function baseQuery(db: Db) {
	return db
		.select(taskRateSelect)
		.from(tasks)
		.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.groupBy(tasks.id)
}

export function getTasksWithRate(db: Db) {
	return baseQuery(db)
		.orderBy(asc(tasks.position), desc(tasks.created_at))
		.all()
		.map((t) => decorateTaskWithRate(t, getDefaultRate()))
}

export function getTaskWithRate(db: Db, id: number) {
	const row = baseQuery(db).where(eq(tasks.id, id)).get()
	return row ? decorateTaskWithRate(row, getDefaultRate()) : null
}

export function getMyDayTasksWithRate(db: Db) {
	return baseQuery(db)
		.where(sql`${tasks.my_day_date} is not null`)
		.orderBy(asc(tasks.position), desc(tasks.created_at))
		.all()
		.map((t) => decorateTaskWithRate(t, getDefaultRate()))
}

export function getTaskForTimer(db: Db, id: number) {
	return getTaskWithRate(db, id)
}
