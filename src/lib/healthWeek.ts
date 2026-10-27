import type { DateKey, Meal, SleepEntry, WorkoutLog } from '../types'
import { averageSleep } from './sleep'
import { dayTotals } from './nutrition'
import { workoutsInDates } from './workout'

export interface HealthWeek {
  workouts: number
  /** Média de água (ml) nos dias com registro, ou null. */
  waterAvg: number | null
  sleepAvg: number | null
  kcalAvg: number | null
}

export function healthWeek(
  data: { workoutLogs: WorkoutLog[]; water: Record<DateKey, number>; sleep: Record<DateKey, SleepEntry>; meals: Meal[] },
  days: DateKey[],
): HealthWeek {
  const waterDays = days.map((d) => data.water[d]).filter((v): v is number => typeof v === 'number' && v > 0)
  const kcalDays = days
    .map((d) => dayTotals(data.meals.filter((m) => m.date === d)).kcal)
    .filter((v) => v > 0)
  const avg = (v: number[]) => (v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null)
  return {
    workouts: workoutsInDates(data.workoutLogs, days),
    waterAvg: avg(waterDays),
    sleepAvg: averageSleep(data.sleep, days),
    kcalAvg: avg(kcalDays),
  }
}
