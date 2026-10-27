import { describe, expect, it } from 'vitest'
import { formatMl, mealsOfDay, totalKcal, waterPercent } from './health'
import type { Meal } from '../types'

const meal = (id: string, type: Meal['type'], kcal: number | null, date = '2026-10-27', createdAt = id): Meal => ({ id, date, type, note: id, kcal, protein: null, carbs: null, fat: null, createdAt })

describe('saúde', () => {
  it('formata água', () => {
    expect(formatMl(250)).toBe('250 ml')
    expect(formatMl(1500)).toBe('1,5 L')
    expect(formatMl(2000)).toBe('2 L')
    expect(formatMl(1250)).toBe('1,25 L')
  })

  it('porcentagem da meta nunca passa de 100', () => {
    expect(waterPercent(1000, 2000)).toBe(50)
    expect(waterPercent(3000, 2000)).toBe(100)
    expect(waterPercent(500, 0)).toBe(0)
  })

  it('ordena refeições do dia e soma calorias ignorando vazias', () => {
    const list = [meal('j', 'jantar', 700), meal('c', 'cafe', 300), meal('x', 'lanche', null), meal('o', 'almoco', 900, '2026-10-26')]
    const day = mealsOfDay(list, '2026-10-27')
    expect(day.map((m) => m.id)).toEqual(['c', 'x', 'j'])
    expect(totalKcal(day)).toBe(1000)
  })
})
