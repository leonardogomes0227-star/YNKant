import { describe, expect, it } from 'vitest'
import { healthWeek } from './healthWeek'
import { HABIT_IDEAS } from './habitIdeas'
import type { Meal, WorkoutLog } from '../types'

const days = ['2026-10-26', '2026-10-27', '2026-10-28']
const meal = (date: string, kcal: number): Meal => ({ id: date + kcal, date, type: 'almoco', note: 'x', kcal, protein: null, carbs: null, fat: null, createdAt: '' })

describe('saúde da semana', () => {
  it('calcula médias só dos dias com registro', () => {
    const h = healthWeek(
      {
        workoutLogs: [{ id: '1', date: '2026-10-26' } as WorkoutLog, { id: '2', date: '2026-10-20' } as WorkoutLog],
        water: { '2026-10-26': 2000, '2026-10-27': 1000 },
        sleep: { '2026-10-26': { hours: 7, quality: null }, '2026-10-27': { hours: 8, quality: null } },
        meals: [meal('2026-10-26', 1800), meal('2026-10-26', 200), meal('2026-10-27', 1000)],
      },
      days,
    )
    expect(h).toEqual({ workouts: 1, waterAvg: 1500, sleepAvg: 7.5, kcalAvg: 1500 })
  })

  it('sem registros, tudo vazio', () => {
    expect(healthWeek({ workoutLogs: [], water: {}, sleep: {}, meals: [] }, days)).toEqual({ workouts: 0, waterAvg: null, sleepAvg: null, kcalAvg: null })
  })

  it('ideias de hábitos têm nome e dias válidos', () => {
    for (const i of HABIT_IDEAS) {
      expect(i.name.length).toBeGreaterThan(3)
      expect(i.days.length).toBeGreaterThan(0)
      expect(i.days.every((d) => d >= 0 && d <= 6)).toBe(true)
    }
  })
})
