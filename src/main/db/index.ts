import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'

export function createDb(dbPath: string) {
	const sqlite = new Database(dbPath)
	sqlite.pragma('journal_mode = WAL')
	const db = drizzle(sqlite)

	migrate(db, { migrationsFolder: join(__dirname, '../../drizzle') })

	return db
}

export type Db = ReturnType<typeof createDb>
