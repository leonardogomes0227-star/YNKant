import type { DateKey, FocusSession } from '../types'

/** Soma os segundos focados em cada dia. */
export function secondsByDate(sessions: FocusSession[]): Record<DateKey, number> {
  const out: Record<DateKey, number> = {}
  for (const s of sessions) out[s.date] = (out[s.date] ?? 0) + s.seconds
  return out
}

export function secondsInDates(sessions: FocusSession[], dates: DateKey[]): number {
  const by = secondsByDate(sessions)
  return dates.reduce((sum, d) => sum + (by[d] ?? 0), 0)
}
