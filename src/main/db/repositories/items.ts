import { asc, desc, eq, sql } from 'drizzle-orm'
import type { EntitySearchResult, EntitySummary, EntityType, RateSource } from '../../../shared/api'
import { costOf } from '../../../shared/cost'
import type { Db } from '../index'
import { getDefaultRate } from '../meta'
import { items, timeEntries } from '../schema'

export function resolveRate(
	itemRate: number | null | undefined,
	defaultRate: number,
): { rate: number; rateSource: RateSource } {
	if (itemRate != null && Number.isFinite(itemRate)) return { rate: itemRate, rateSource: 'item' }
	return { rate: defaultRate, rateSource: 'default' }
}

type ItemRateRow = {
	id: number
	name: string
	description: string | null
	descriptionMd: string | null
	descriptionHtml: string | null
	createdAt: string | null
	parentId: number | null
	entityType: string
	hourlyRate: number | null
	totalDuration: number
}

function getRows(db: Db) {
	return db
		.select({
			id: items.id,
			name: items.name,
			description: items.description,
			descriptionMd: items.descriptionMd,
			descriptionHtml: items.descriptionHtml,
			statusId: items.statusId,
			parentId: items.parentId,
			myDayDate: items.myDayDate,
			reminderAt: items.reminderAt,
			createdAt: items.createdAt,
			position: items.position,
			canvasX: items.canvasX,
			canvasY: items.canvasY,
			canvasWidth: items.canvasWidth,
			canvasHeight: items.canvasHeight,
			groupId: items.groupId,
			hourlyRate: items.hourlyRate,
			entityType: items.entityType,
			totalDuration: sql<number>`coalesce(sum(${timeEntries.duration}), 0)`,
		})
		.from(items)
		.leftJoin(timeEntries, eq(items.id, timeEntries.itemId))
		.groupBy(items.id)
}

function decorateRows<T extends ItemRateRow>(rows: T[], defaultRate: number) {
	const byId = new Map(rows.map((row) => [row.id, row]))

	return rows.map((row) => {
		const parent = row.parentId == null ? null : byId.get(row.parentId)
		const { rate, rateSource } = resolveRate(row.hourlyRate, defaultRate)
		return {
			...row,
			description: row.description ?? '',
			descriptionMd: row.descriptionMd ?? '',
			descriptionHtml: row.descriptionHtml ?? '',
			createdAt: row.createdAt ?? '',
			entityType: row.entityType as EntityType,
			parentName: parent?.name ?? null,
			parentType: (parent?.entityType as EntityType | undefined) ?? null,
			rate,
			rateSource,
			cost: costOf(row.totalDuration ?? 0, rate),
		}
	})
}

export function getItemsWithRate(db: Db) {
	return decorateRows(getRows(db).all(), getDefaultRate()).sort(
		(a, b) => a.position - b.position || String(b.createdAt).localeCompare(String(a.createdAt)),
	)
}

export function getItemWithRate(db: Db, id: number) {
	return getItemsWithRate(db).find((item) => item.id === id) ?? null
}

export function getMyDayItemsWithRate(db: Db) {
	return getItemsWithRate(db).filter((item) => item.myDayDate != null)
}

export function getItemForTimer(db: Db, id: number) {
	return getItemWithRate(db, id)
}

export function getEntityChildren(db: Db, parentId: number) {
	return getItemsWithRate(db).filter((item) => item.parentId === parentId)
}

export function getEntityAncestors(db: Db, entityId: number): EntitySummary[] {
	const entities = new Map(getItemsWithRate(db).map((item) => [item.id, item]))
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

function toFtsQuery(value: string) {
	return value
		.normalize('NFKC')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 8)
		.map((token) => `"${token.replaceAll('"', '""')}"*`)
		.join(' AND ')
}

export function searchEntities(db: Db, value: unknown, requestedLimit?: unknown): EntitySearchResult[] {
	if (typeof value !== 'string') return []
	const query = toFtsQuery(value.slice(0, 256))
	if (!query) return []
	const limit = Math.min(50, Math.max(1, Math.floor(Number(requestedLimit) || 20)))

	return db.all<EntitySearchResult>(sql`
			SELECT
				t.id,
				t.name,
				t.entity_type AS entityType,
				parent.name AS parentName,
				snippet(entity_search_fts, 1, '', '', '...', 18) AS snippet
			FROM entity_search_fts
			JOIN items AS t ON t.id = entity_search_fts.rowid
			LEFT JOIN items AS parent ON parent.id = t.parent_id
			WHERE entity_search_fts MATCH ${query}
			ORDER BY bm25(entity_search_fts, 10.0, 1.0), lower(t.name)
			LIMIT ${limit}
		`)
}
