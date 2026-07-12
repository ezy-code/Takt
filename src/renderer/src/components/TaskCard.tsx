import { Text, Group, Button, Card, ActionIcon, Tooltip } from '@mantine/core'
import { IconCalendarPlus, IconCalendarCheck, IconAlertCircle, IconX } from '@tabler/icons-react'
import ReactMarkdown from 'react-markdown'
import { TimerControl } from './TimerControl'
import { useDeleteTask, useToggleToday, useClearToday } from '../api'
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
  const deleteTask = useDeleteTask()
  const toggleToday = useToggleToday()
  const clearToday = useClearToday()

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
            <Text fw={500}>{task.name}</Text>
            {todayState === 'overdue' && (
              <Text size="xs" c="red">(overdue)</Text>
            )}
          </Group>
          {task.description && (
            <Text size="sm" c="dimmed" component="div">
              <ReactMarkdown>{task.description}</ReactMarkdown>
            </Text>
          )}
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
          <Button variant="light" color="red" size="xs" onClick={() => deleteTask.mutate(task.id)}>
            Delete
          </Button>
        </Group>
      </Group>
    </Card>
  )
}
