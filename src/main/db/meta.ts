import { eq } from 'drizzle-orm'
import { META_DEFAULT_RATE_KEY } from '../../shared/constants'
import type { Db } from './index'
import { appMeta } from './schema'

let dbRef: Db | null = null

export function initMetaDb(db: Db) {
	dbRef = db
}

function db(): Db {
	if (!dbRef) throw new Error('meta db not initialized')
	return dbRef
}

export function getMeta(key: string): string | null {
	return db().select({ value: appMeta.value }).from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null
}

export function setMeta(key: string, value: string): void {
	db().insert(appMeta).values({ key, value }).onConflictDoUpdate({ target: appMeta.key, set: { value } }).run()
}

export function getDefaultRate(): number {
	const n = Number(getMeta(META_DEFAULT_RATE_KEY))
	return Number.isFinite(n) ? n : 0
}
