import { useState, useEffect } from 'react'
import { Container, Title, Switch, Group, Text, Stack, SegmentedControl } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { createLazyRoute } from '@tanstack/react-router'
import { IconSun, IconMoon, IconDeviceDesktop, IconPower } from '@tabler/icons-react'
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
  const [autostart, setAutostart] = useState(false)

  useEffect(() => {
    window.api.getAutostart().then(setAutostart)
  }, [])

  return (
    <Container fluid py="xl">
      <Title order={1} mb="lg">Settings</Title>
      <Stack gap="lg">
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

        <Group justify="space-between" w="100%">
          <Group gap="xs">
            <IconPower size={18} />
            <Text fw={500}>Launch at system startup</Text>
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
      </Stack>
    </Container>
  )
}

export { Route }
