export type TimerChangeInfo = { active: false } | { active: true; startTime: string; taskName: string }

export type OnTimerChange = (info: TimerChangeInfo) => void
