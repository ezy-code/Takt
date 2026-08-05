import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { ru } from './locales/ru'

export const LANGUAGE_KEY = 'language'

export function detectSystemLanguage(): string {
	const system = (navigator.language ?? '').toLowerCase()
	return system.startsWith('ru') ? 'ru' : 'en'
}

export async function resolveLanguage(): Promise<string> {
	const saved = await window.api.getMeta(LANGUAGE_KEY)
	return saved === 'ru' || saved === 'en' ? saved : detectSystemLanguage()
}

export function applyLanguage(lng: string): void {
	window.api.setMeta(LANGUAGE_KEY, lng)
	i18n.changeLanguage(lng)
}

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ru: { translation: ru },
	},
	lng: detectSystemLanguage(),
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
	document.documentElement.lang = lng
})

export default i18n
