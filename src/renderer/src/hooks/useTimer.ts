import { useState, useEffect } from 'react'

export function useTimer(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime) return

    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      setElapsed(Math.max(0, diff))
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startTime])

  return { display: formatDuration(elapsed), elapsed }
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
