import type { DateKey, FocusSession, Habit, JournalEntry, Task } from '../types'
import { toKey } from './dates'
import { isDone, isScheduled } from './streak'

export interface DaySummary {
  date: DateKey
  tasks: number
  habitsDone: number
  habitsScheduled: number
  focusSeconds: number
  mood: number | null
}

export interface WeekSummary {
  days: DaySummary[]
  tasksDone: number
  habitsDone: number
  habitsScheduled: number
  /** 0–1, considera só os dias até hoje. */
  habitRate: number
  focusSeconds: number
  moodAvg: number | null
  byHabit: { habit: Habit; done: number; scheduled: number }[]
  completedTasks: Task[]
}

/** Data local (yyyy-MM-dd) em que a tarefa foi concluída. */
export function completionDate(t: Task): DateKey | null {
  return t.completedAt ? toKey(new Date(t.completedAt)) : null
}

export function weekSummary(
  data: { tasks: Task[]; habits: Habit[]; focusSessions: FocusSession[]; journal: Record<DateKey, JournalEntry> },
  weekDays: DateKey[],
  today: DateKey,
): WeekSummary {
  const completed = data.tasks.filter((t) => {
    const d = completionDate(t)
    return t.done && d !== null && weekDays.includes(d)
  })

  const days: DaySummary[] = weekDays.map((date) => {
    const past = date <= today
    const habits = past ? data.habits.filter((h) => isScheduled(h, date)) : []
    return {
      date,
      tasks: completed.filter((t) => completionDate(t) === date).length,
      habitsScheduled: habits.length,
      habitsDone: habits.filter((h) => isDone(h, date)).length,
      focusSeconds: data.focusSessions.filter((s) => s.date === date).reduce((n, s) => n + s.seconds, 0),
      mood: data.journal[date]?.mood ?? null,
    }
  })

  const moods = days.map((d) => d.mood).filter((m): m is number => m !== null)
  const habitsDone = days.reduce((n, d) => n + d.habitsDone, 0)
  const habitsScheduled = days.reduce((n, d) => n + d.habitsScheduled, 0)

  return {
    days,
    tasksDone: completed.length,
    habitsDone,
    habitsScheduled,
    habitRate: habitsScheduled ? habitsDone / habitsScheduled : 0,
    focusSeconds: days.reduce((n, d) => n + d.focusSeconds, 0),
    moodAvg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    byHabit: data.habits
      .map((habit) => {
        const sched = weekDays.filter((d) => d <= today && isScheduled(habit, d))
        return { habit, scheduled: sched.length, done: sched.filter((d) => isDone(habit, d)).length }
      })
      .filter((h) => h.scheduled > 0),
    completedTasks: completed.sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? '')),
  }
}
