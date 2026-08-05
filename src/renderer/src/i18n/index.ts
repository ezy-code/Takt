import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { ru } from './locales/ru'

export const LANGUAGE_KEY = 'takt-language'

function getInitialLanguage(): string {
	const saved = localStorage.getItem(LANGUAGE_KEY)
	if (saved === 'ru' || saved === 'en') return saved
	const system = (navigator.language ?? '').toLowerCase()
	return system.startsWith('ru') ? 'ru' : 'en'
}

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ru: { translation: ru },
	},
	lng: getInitialLanguage(),
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
	document.documentElement.lang = lng
})

export default i18n
