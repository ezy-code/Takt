import { Text, Group, Card, ActionIcon, Tooltip, Anchor, Spoiler, Menu } from '@mantine/core'
import { IconCalendarPlus, IconCalendarCheck, IconAlertCircle, IconX, IconDots, IconEye, IconPencil, IconTrash } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { MarkdownPreview } from './MarkdownPreview'
import { TimerControl } from './TimerControl'
import { useDeleteTask, useToggleToday, useClearToday, useStatuses } from '../api'
import { ROUTES } from '../routes'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
}

function getTodayState(todayDate: string | null | undefined): 'none' | 'today' | 'overdue' {
  if (!todayDate) return 'none'
  const today = new Date().toISOString().split('T')[0]
  if (todayDate === today) return 'today'
  return 'overdue'
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate()
  const deleteTask = useDeleteTask()
  const toggleToday = useToggleToday()
  const clearToday = useClearToday()
  const { data: statuses } = useStatuses()

  const status = statuses?.find((s) => s.id === task.statusId)
  const todayState = getTodayState(task.today_date ?? null)

  const TodayIcon = todayState === 'today' ? IconCalendarCheck
    : todayState === 'overdue' ? IconAlertCircle
    : IconCalendarPlus

  const todayColor = todayState === 'today' ? 'green'
    : todayState === 'overdue' ? 'red'
    : 'gray'

  const todayTooltip = todayState === 'today' ? 'Remove from Today'
    : todayState === 'overdue' ? 'Move to Today'
    : 'Add to Today'

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Group gap="xs">
            <Anchor component="button" fw={500} style={{ textAlign: 'left' }} onClick={() => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(task.id) } })}>
              {task.name}
            </Anchor>
            {status && (
              <Group gap={4}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
                <Text size="xs" c="dimmed">{status.name}</Text>
              </Group>
            )}
            {todayState === 'overdue' && (
              <Text size="xs" c="red">(overdue)</Text>
            )}
          </Group>
          {/* {task.description_md && (
            <Spoiler maxHeight={80} showLabel="Show more" hideLabel="Hide">
              <MarkdownPreview content={task.description_md} variant="preview" />
            </Spoiler>
          )} */}
          <Text size="xs" c="gray" mt={4}>
            {new Date(task.created_at).toLocaleString()}
          </Text>
        </div>
        <Group gap="xs">
          <TimerControl taskId={task.id} duration={task.total_duration} />
          <Tooltip label={todayTooltip}>
            <ActionIcon
              variant={todayState === 'today' ? 'filled' : 'subtle'}
              color={todayColor}
              size="sm"
              onClick={() => toggleToday.mutate(task.id)}
            >
              <TodayIcon size={14} />
            </ActionIcon>
          </Tooltip>
          {todayState === 'overdue' && (
            <Tooltip label="Remove from list">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => clearToday.mutate(task.id)}>
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Task actions">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => navigate({ to: ROUTES.TASK_DETAIL, params: { id: String(task.id) } })}
              >
                View
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPencil size={14} />}
                onClick={() => navigate({ to: ROUTES.TASK_EDIT, params: { id: String(task.id) } })}
              >
                Edit
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => deleteTask.mutate(task.id)}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Card>
  )
}
