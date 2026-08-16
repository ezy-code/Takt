import { asc, desc, eq, sql } from 'drizzle-orm'
import type { EntitySummary, EntityType, RateSource } from '../../../shared/api'
import { costOf } from '../../../shared/cost'
import type { Db } from '../index'
import { getDefaultRate } from '../meta'
import { taskLinks, tasks, timeEntries } from '../schema'

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
	id: number
	name: string
	description: string | null
	description_md: string | null
	description_html: string | null
	created_at: string | null
	parentId: number | null
	entityType: string
	hourly_rate: number | null
	total_duration: number
	project_rate?: never
}

function getRows(db: Db) {
	return db
		.select({
			id: tasks.id,
			name: tasks.name,
			description: tasks.description,
			description_md: tasks.descriptionMarkdown,
			description_html: tasks.descriptionHtml,
			statusId: tasks.statusId,
			parentId: tasks.parentId,
			my_day_date: tasks.my_day_date,
			reminder_at: tasks.reminderAt,
			created_at: tasks.created_at,
			position: tasks.position,
			canvasX: tasks.canvasX,
			canvasY: tasks.canvasY,
			groupId: tasks.groupId,
			hourly_rate: tasks.hourly_rate,
			entityType: tasks.entityType,
			total_duration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
			relatedCount: sql<number>`(
				select count(*)
				from ${taskLinks}
				where ${taskLinks.sourceTaskId} = ${tasks.id} or ${taskLinks.targetTaskId} = ${tasks.id}
			)`,
		})
		.from(tasks)
		.leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
		.groupBy(tasks.id)
}

function decorateRows<T extends TaskRateRow>(rows: T[], defaultRate: number) {
	const byId = new Map(rows.map((row) => [row.id, row]))

	return rows.map((row) => {
		let parentId = row.parentId
		let projectRate: number | null = null
		const visited = new Set<number>()

		while (parentId != null && !visited.has(parentId)) {
			visited.add(parentId)
			const parent = byId.get(parentId)
			if (!parent) break
			if (parent.entityType === 'project' && parent.hourly_rate != null && Number.isFinite(parent.hourly_rate)) {
				projectRate = parent.hourly_rate
				break
			}
			parentId = parent.parentId
		}

		const { rate, rateSource } = resolveRate(row.hourly_rate, projectRate, defaultRate)
		const parent = row.parentId == null ? null : byId.get(row.parentId)
		return {
			...row,
			description: row.description ?? '',
			description_md: row.description_md ?? '',
			description_html: row.description_html ?? '',
			created_at: row.created_at ?? '',
			entityType: row.entityType as EntityType,
			parentName: parent?.name ?? null,
			parentType: (parent?.entityType as EntityType | undefined) ?? null,
			rate,
			rateSource,
			cost: costOf(row.total_duration ?? 0, rate),
		}
	})
}

export function getTasksWithRate(db: Db) {
	return decorateRows(getRows(db).all(), getDefaultRate()).sort(
		(a, b) => a.position - b.position || String(b.created_at).localeCompare(String(a.created_at)),
	)
}

export function getTaskWithRate(db: Db, id: number) {
	return getTasksWithRate(db).find((task) => task.id === id) ?? null
}

export function getMyDayTasksWithRate(db: Db) {
	return getTasksWithRate(db).filter((task) => task.my_day_date != null)
}

export function getTaskForTimer(db: Db, id: number) {
	return getTaskWithRate(db, id)
}

export function getEntityChildren(db: Db, parentId: number) {
	return getTasksWithRate(db).filter((task) => task.parentId === parentId)
}

export function getEntityAncestors(db: Db, entityId: number): EntitySummary[] {
	const entities = new Map(getTasksWithRate(db).map((task) => [task.id, task]))
	const ancestors: EntitySummary[] = []
	let parentId = entities.get(entityId)?.parentId
	const visited = new Set<number>()

	while (parentId != null && !visited.has(parentId)) {
		visited.add(parentId)
		const parent = entities.get(parentId)
		if (!parent) break
		ancestors.unshift({ id: parent.id, name: parent.name, entityType: parent.entityType })
		parentId = parent.parentId
	}

	return ancestors
}
