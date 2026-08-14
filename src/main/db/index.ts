import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import { join } from 'path'

export function createDb(dbPath: string) {
	const sqlite = new DatabaseSync(dbPath)
	sqlite.exec('PRAGMA journal_mode = WAL')
	const db = drizzle({ client: sqlite })

	migrate(db, { migrationsFolder: join(__dirname, '../../drizzle') })

	return db
}

export type Db = ReturnType<typeof createDb>
