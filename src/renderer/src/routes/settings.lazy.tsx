import {
	Button,
	Container,
	Group,
	SegmentedControl,
	Stack,
	Switch,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core'
import { IconDeviceDesktop, IconLanguage, IconMoon, IconPower, IconRefresh, IconSun } from '@tabler/icons-react'
import { createLazyRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import UpdateSection from '../components/UpdateSection'
import { useUpdater } from '../hooks/useUpdater'
import { applyLanguage } from '../i18n'
import { ROUTES } from '../routes'

const themeData = [
	{ label: 'Light', value: 'light', icon: IconSun },
	{ label: 'System', value: 'auto', icon: IconDeviceDesktop },
	{ label: 'Dark', value: 'dark', icon: IconMoon },
]

const languageData = [
	{ label: 'English', value: 'en' },
	{ label: 'Русский', value: 'ru' },
]

const Route = createLazyRoute(ROUTES.SETTINGS)({
	component: SettingsPage,
})

function SettingsPage() {
	const { t, i18n } = useTranslation()
	const { setColorScheme } = useMantineColorScheme()
	const [preference, setPreference] = useState<'light' | 'dark' | 'auto'>(
		() => (localStorage.getItem('mantine-color-scheme') as 'light' | 'dark' | 'auto' | null) ?? 'auto',
	)
	const [language, setLanguage] = useState(i18n.resolvedLanguage === 'ru' ? 'ru' : 'en')
	const [autostart, setAutostart] = useState(false)
	const updater = useUpdater()
	const hasUpdate = ['available', 'downloading', 'downloaded'].includes(updater.state.status)

	useEffect(() => {
		window.api.getAutostart().then(setAutostart)
	}, [])

	return (
		<Container fluid py='xl'>
			<Title order={1} mb='lg'>
				{t('settings.title')}
			</Title>
			<Stack gap='lg'>
				<Group justify='space-between' w='100%'>
					<Text fw={500}>{t('settings.theme')}</Text>
					<SegmentedControl
						value={preference}
						onChange={(v) => {
							setPreference(v as 'light' | 'dark' | 'auto')
							setColorScheme(v as 'light' | 'dark' | 'auto')
						}}
						data={themeData.map((t) => ({
							value: t.value,
							label: (
								<Group gap='xs' wrap='nowrap'>
									<t.icon size={16} />
									<span>{t.label}</span>
								</Group>
							),
						}))}
					/>
				</Group>

				<Group justify='space-between' w='100%'>
					<Group gap='xs'>
						<IconLanguage size={18} />
						<Text fw={500}>{t('settings.language')}</Text>
					</Group>
					<SegmentedControl
						value={language}
						onChange={(v) => {
							setLanguage(v as 'en' | 'ru')
							applyLanguage(v)
						}}
						data={languageData}
					/>
				</Group>

				<Group justify='space-between' w='100%'>
					<Group gap='xs'>
						<IconPower size={18} />
						<Text fw={500}>{t('settings.launchAtStartup')}</Text>
					</Group>
					<Switch
						checked={autostart}
						onChange={(e) => {
							const val = e.currentTarget.checked
							setAutostart(val)
							window.api.setAutostart(val)
						}}
					/>
				</Group>

				<Stack gap='xs'>
					<Group justify='space-between' w='100%'>
						<Group gap='xs'>
							<IconRefresh size={18} />
							<Text fw={500}>{t('settings.updates')}</Text>
							<Text size='sm' c='dimmed'>
								{t('settings.version', { version: updater.state.currentVersion })}
							</Text>
						</Group>
						{hasUpdate ? (
							<UpdateSection />
						) : (
							<Button
								variant='light'
								leftSection={<IconRefresh size={16} />}
								loading={updater.state.status === 'checking'}
								onClick={updater.check}
							>
								{t('settings.checkForUpdates')}
							</Button>
						)}
					</Group>
					{updater.state.status === 'checking' && (
						<Text size='sm' c='dimmed'>
							{t('settings.checkingForUpdates')}
						</Text>
					)}
					{updater.state.status === 'not-available' && (
						<Text size='sm' c='dimmed'>
							{t('settings.upToDate')}
						</Text>
					)}
					{updater.state.status === 'error' && updater.state.error && (
						<Text size='sm' c='red'>
							{t('settings.updateError', { error: updater.state.error })}
						</Text>
					)}
				</Stack>
			</Stack>
		</Container>
	)
}

export { Route }
