export type TimerChangeInfo = { active: false } | { active: true; startTime: string; itemName: string; itemId: number }

export type OnTimerChange = (info: TimerChangeInfo) => void
