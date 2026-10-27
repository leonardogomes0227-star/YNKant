import type { DateKey, SleepEntry } from '../types'
import { timeToMin } from './dates'

/** Horas dormidas entre deitar e acordar (atravessa a meia-noite). "23:30" → "07:00" = 7,5. */
export function sleepHours(bed: string, wake: string): number {
  const b = timeToMin(bed)
  const w = timeToMin(wake)
  const min = w >= b ? w - b : 24 * 60 - b + w
  return Math.round((min / 60) * 10) / 10
}

export function averageSleep(sleep: Record<DateKey, SleepEntry>, dates: DateKey[]): number | null {
  const v = dates.map((d) => sleep[d]?.hours).filter((h): h is number => typeof h === 'number')
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
}

export function formatHours(h: number): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`
}
