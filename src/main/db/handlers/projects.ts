import { desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { AddProjectPayload, UpdateProjectPayload } from '../../../shared/api'
import { IPC } from '../../../shared/ipc'
import type { Db } from '../index'
import { projects } from '../schema'

const projectSelect = {
	id: projects.id,
	name: projects.name,
	description: projects.description,
	description_md: projects.descriptionMarkdown,
	description_html: projects.descriptionHtml,
	created_at: projects.created_at,
	hourly_rate: projects.hourly_rate,
}

export function registerProjectsHandlers(db: Db) {
	ipcMain.handle(IPC.GET_PROJECTS, () => {
		return db.select(projectSelect).from(projects).orderBy(desc(projects.created_at)).all()
	})

	ipcMain.handle(IPC.GET_PROJECT, (_event, id: number) => {
		return db.select(projectSelect).from(projects).where(eq(projects.id, id)).get()
	})

	ipcMain.handle(
		IPC.ADD_PROJECT,
		(_event, { name, description, description_md, description_html, hourlyRate }: AddProjectPayload) => {
			return db
				.insert(projects)
				.values({
					name,
					description: description ?? '',
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
					hourly_rate: hourlyRate ?? null,
				})
				.returning()
				.get()
		},
	)

	ipcMain.handle(
		IPC.UPDATE_PROJECT,
		(_event, { id, name, description, description_md, description_html, hourlyRate }: UpdateProjectPayload) => {
			return db
				.update(projects)
				.set({
					name,
					description: description ?? '',
					descriptionMarkdown: description_md ?? '',
					descriptionHtml: description_html ?? '',
					...((hourlyRate !== undefined ? { hourly_rate: hourlyRate } : {}) as object),
				})
				.where(eq(projects.id, id))
				.returning()
				.get()
		},
	)
}
