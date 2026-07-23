import { useEffect, useState } from 'react'

const TICK_MS = 30_000

// A single shared ticking clock so SLA timers stay live without per-timer intervals.
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])
  return now
}
