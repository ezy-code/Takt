import { Box, Button, Progress, Text } from '@mantine/core'
import { IconDownload, IconRefresh } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useUpdater } from '../hooks/useUpdater'

export default function UpdateSection() {
	const { state, download, restart } = useUpdater()
	const { t } = useTranslation()

	if (state.status === 'available' && state.latestVersion) {
		return (
			<Box px='xs' pb='xs'>
				<Text size='xs' c='dimmed' mb={6}>
					{t('updater.available', { version: state.latestVersion })}
				</Text>
				<Button size='xs' variant='light' fullWidth leftSection={<IconDownload size={14} />} onClick={download}>
					{t('settings.download')}
				</Button>
			</Box>
		)
	}

	if (state.status === 'downloading' && state.progress) {
		return (
			<Box px='xs' pb='xs'>
				<Text size='xs' c='dimmed' mb={4}>
					{t('updater.downloading', { version: state.latestVersion })} {state.progress.percent.toFixed(0)}%
				</Text>
				<Progress size='xs' value={state.progress.percent} />
			</Box>
		)
	}

	if (state.status === 'downloaded' && state.latestVersion) {
		return (
			<Box px='xs' pb='xs'>
				<Text size='xs' c='dimmed' mb={6}>
					{t('updater.ready', { version: state.latestVersion })}
				</Text>
				<Button size='xs' variant='light' fullWidth leftSection={<IconRefresh size={14} />} onClick={restart}>
					{t('updater.restart')}
				</Button>
			</Box>
		)
	}

	if (state.status === 'error' && state.error) {
		return (
			<Text size='xs' c='red'>
				{t('settings.updateError', { error: state.error })}
			</Text>
		)
	}

	return null
}
