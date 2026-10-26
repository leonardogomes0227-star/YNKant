import type { DateKey, Habit } from '../types'
import { diffDays, fromKey, shiftKey, weekdayOf } from './dates'

type HabitCore = Pick<Habit, 'days' | 'target' | 'log' | 'createdAt'>

export function isScheduled(habit: Pick<Habit, 'days'>, key: DateKey): boolean {
  return habit.days.includes(weekdayOf(key))
}

export function isDone(habit: Pick<Habit, 'target' | 'log'>, key: DateKey): boolean {
  return (habit.log[key] ?? 0) >= Math.max(1, habit.target)
}

export interface HabitStats {
  current: number
  best: number
  /** 0–1, últimos 30 dias (ou desde a criação). */
  rate: number
  scheduled: number
  completed: number
}

/**
 * Sequência = dias agendados concluídos em seguida. Dias fora da frequência são
 * ignorados (não quebram nem contam). Se hoje ainda não foi feito, a sequência
 * atual não é zerada: só quebra quando um dia agendado passado ficou sem fazer.
 */
export function habitStats(habit: HabitCore, today: DateKey, windowDays = 30): HabitStats {
  const start = habit.createdAt < today ? habit.createdAt : today
  // também considera registros anteriores à criação (ex.: importados)
  const logged = Object.keys(habit.log).filter((k) => isDone(habit, k)).sort()
  const first = logged.length && logged[0] < start ? logged[0] : start
  const span = diffDays(today, first)

  let best = 0
  let run = 0
  for (let i = span; i >= 0; i--) {
    const key = shiftKey(today, -i)
    if (!isScheduled(habit, key)) continue
    if (isDone(habit, key)) {
      run++
      best = Math.max(best, run)
    } else if (key !== today) {
      run = 0
    }
  }

  let current = 0
  for (let i = 0; i <= span; i++) {
    const key = shiftKey(today, -i)
    if (!isScheduled(habit, key)) continue
    if (isDone(habit, key)) current++
    else if (key === today) continue
    else break
  }

  let scheduled = 0
  let completed = 0
  const winStart = Math.min(windowDays - 1, span)
  for (let i = 0; i <= winStart; i++) {
    const key = shiftKey(today, -i)
    if (!isScheduled(habit, key)) continue
    if (key === today && !isDone(habit, key)) continue // hoje ainda pode ser feito
    scheduled++
    if (isDone(habit, key)) completed++
  }
  return { current, best, rate: scheduled ? completed / scheduled : 0, scheduled, completed }
}

/** Datas do calendário de calor: de `weeks` semanas atrás até hoje, alinhado em semanas (seg–dom). */
export function heatmapRange(today: DateKey, weeks = 13): DateKey[] {
  const dow = (weekdayOf(today) + 6) % 7 // 0 = segunda
  const end = shiftKey(today, 6 - dow)
  const total = weeks * 7
  return Array.from({ length: total }, (_, i) => shiftKey(end, -(total - 1 - i)))
}

export function isFuture(key: DateKey, today: DateKey): boolean {
  return fromKey(key).getTime() > fromKey(today).getTime()
}
