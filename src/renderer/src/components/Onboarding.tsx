import { Button, Center, Select, Stack, Title } from '@mantine/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '../../../shared/constants'
import { applyLanguage } from '../i18n'

const languageData = [
	{ label: 'English', value: 'en' },
	{ label: 'Русский', value: 'ru' },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
	const { t, i18n } = useTranslation()
	const [language, setLanguage] = useState(i18n.resolvedLanguage === 'ru' ? 'ru' : 'en')

	return (
		<Center h='100vh'>
			<Stack align='center' gap='lg'>
				<Title order={1}>{APP_NAME}</Title>
				<Select
					data={languageData}
					value={language}
					onChange={(v) => {
						const value = (v ?? 'en') as 'en' | 'ru'
						setLanguage(value)
						applyLanguage(value)
					}}
					w={220}
					label={t('settings.language')}
				/>
				<Button size='md' onClick={onDone}>
					{t('onboarding.getStarted')}
				</Button>
			</Stack>
		</Center>
	)
}
