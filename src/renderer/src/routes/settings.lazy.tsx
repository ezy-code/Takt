import { useState } from 'react'
import { Container, Title, SegmentedControl, Group, Text } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react'
import { ROUTES } from '../routes'

const themeData = [
  { label: 'Light', value: 'light', icon: IconSun },
  { label: 'System', value: 'auto', icon: IconDeviceDesktop },
  { label: 'Dark', value: 'dark', icon: IconMoon },
]

const Route = createLazyRoute(ROUTES.SETTINGS)({
  component: SettingsPage,
})

function SettingsPage() {
  const { setColorScheme } = useMantineColorScheme()
  const [preference, setPreference] = useState<'light' | 'dark' | 'auto'>(
    () => (localStorage.getItem('mantine-color-scheme') as 'light' | 'dark' | 'auto' | null) ?? 'auto'
  )

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="lg">Settings</Title>
      <Group justify="space-between" w="100%">
        <Text fw={500}>Theme</Text>
        <SegmentedControl
          value={preference}
          onChange={(v) => {
            setPreference(v as 'light' | 'dark' | 'auto')
            setColorScheme(v as 'light' | 'dark' | 'auto')
          }}
          data={themeData.map((t) => ({
            value: t.value,
            label: (
              <Group gap="xs" wrap="nowrap">
                <t.icon size={16} />
                <span>{t.label}</span>
              </Group>
            ),
          }))}
        />
      </Group>
    </Container>
  )
}

export { Route }
