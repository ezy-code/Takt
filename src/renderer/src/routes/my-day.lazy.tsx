import { Box, Container, Text, Title } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useItems, useMyDayItems } from '../api'
import { ItemGrid } from '../components/ItemGrid'
import { OtherItemsSection } from '../components/OtherItemsSection'
import { ROUTES } from '../routes'

function MyDayPage() {
	const { t } = useTranslation()
	const { data: myDayItems } = useMyDayItems()
	const { data: allItems } = useItems()

	const today = new Date().toISOString().split('T')[0]
	const items = myDayItems ?? []
	const overdue = items.filter((t) => t.myDayDate && t.myDayDate < today)
	const current = items.filter((t) => t.myDayDate === today)
	const otherItems = (allItems ?? []).filter((t) => !t.myDayDate)

	return (
		<Container
			fluid
			py='xl'
			style={{
				display: 'flex',
				flexDirection: 'column',
				height:
					'calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-footer-offset, 0rem) - 2 * var(--app-shell-padding))',
			}}
		>
			<Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
				<Title order={1} mb='lg'>
					{t('myDay.title')}
				</Title>

				{overdue.length > 0 && (
					<>
						<Title order={2} size='h3' c='red' mb='sm'>
							{t('myDay.overdue')}
						</Title>
						<Box mb='xl'>
							<ItemGrid items={overdue} />
						</Box>
					</>
				)}

				{current.length > 0 ? (
					<>
						<Title order={2} size='h3' c='green' mb='sm'>
							{t('myDay.today')}
						</Title>
						<Box mb='xl'>
							<ItemGrid items={current} />
						</Box>
					</>
				) : (
					<Text c='dimmed'>{t('myDay.nothingAdded')}</Text>
				)}
			</Box>

			<Box pt='md'>
				<OtherItemsSection items={otherItems} />
			</Box>
		</Container>
	)
}

export const Route = createLazyRoute(ROUTES.MY_DAY)({
	component: MyDayPage,
})
