import { ActionIcon, Group, Kbd, Text } from '@mantine/core'
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks'
import { Spotlight, spotlight } from '@mantine/spotlight'
import { IconSearch } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntitySearch } from '../api'
import { ROUTES } from '../routes'
import { EntityTypeBadge } from './EntityTypeBadge'

export function SpotlightSearch() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const compact = useMediaQuery('(max-width: 600px)')
	const [query, setQuery] = useState('')
	const [debouncedQuery] = useDebouncedValue(query, 300)
	const search = useEntitySearch(debouncedQuery, 20)
	const results = search.data ?? []

	const openResult = (id: number) => {
		spotlight.close()
		navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(id) } })
	}

	return (
		<>
			<Group gap={4} wrap='nowrap'>
				<ActionIcon variant='subtle' size='lg' aria-label={t('search.open')} onClick={spotlight.open}>
					<IconSearch size={19} />
				</ActionIcon>
				<Kbd>/</Kbd>
			</Group>
			<Spotlight.Root
				query={query}
				onQueryChange={setQuery}
				clearQueryOnClose
				shortcut={['mod + K', '/']}
				fullScreen={compact}
				size='lg'
				scrollable
				maxHeight='min(60vh, 480px)'
				onSpotlightClose={() => setQuery('')}
			>
				<Spotlight.Search placeholder={t('search.placeholder')} leftSection={<IconSearch size={16} />} />
				<Spotlight.ActionsList>
					{!debouncedQuery.trim() ? (
						<Spotlight.Empty>{t('search.hint')}</Spotlight.Empty>
					) : !results.length ? (
						<Spotlight.Empty>{t('search.noResults')}</Spotlight.Empty>
					) : (
						results.map((result) => (
							<Spotlight.Action key={result.id} onClick={() => openResult(result.id)}>
								<Group gap='xs' wrap='nowrap' w='100%'>
									<EntityTypeBadge entityType={result.entityType} />
									<div style={{ flex: 1, minWidth: 0 }}>
										<Text fw={500} truncate>
											{result.name}
										</Text>
										{result.parentName && (
											<Text size='xs' c='dimmed' truncate>
												{result.parentName}
											</Text>
										)}
										{result.snippet && (
											<Text size='xs' c='dimmed' lineClamp={2}>
												{result.snippet}
											</Text>
										)}
									</div>
								</Group>
							</Spotlight.Action>
						))
					)}
				</Spotlight.ActionsList>
				<Spotlight.Footer>
					<Group justify='flex-end' gap='xs'>
						<Kbd>↑↓</Kbd>
						<Text size='xs' c='dimmed'>
							{t('search.navigate')}
						</Text>
						<Kbd>Enter</Kbd>
						<Text size='xs' c='dimmed'>
							{t('search.openResult')}
						</Text>
					</Group>
				</Spotlight.Footer>
			</Spotlight.Root>
		</>
	)
}
