export type TimerChangeInfo = { active: false } | { active: true; startTime: string; taskName: string; taskId: number }

export type OnTimerChange = (info: TimerChangeInfo) => void
