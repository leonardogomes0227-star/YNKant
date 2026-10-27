import { describe, expect, it } from 'vitest'
import { dayTotals, goalPercent, kcalByDate, recentFoods } from './nutrition'
import type { Meal } from '../types'

const meal = (note: string, date: string, kcal: number | null, protein: number | null = null, createdAt = date): Meal => ({
  id: note + date, date, type: 'almoco', note, kcal, protein, carbs: null, fat: null, createdAt,
})

describe('alimentação', () => {
  it('soma calorias e macros ignorando o que não foi preenchido', () => {
    const t = dayTotals([meal('a', 'd', 500, 30), meal('b', 'd', null, 20), meal('c', 'd', 250)])
    expect(t).toEqual({ kcal: 750, protein: 50, carbs: 0, fat: 0 })
  })

  it('lista comidas recentes sem repetir', () => {
    const list = [meal('Arroz e frango', '2026-10-20', 600), meal('arroz e frango', '2026-10-25', 650), meal('Ovo mexido', '2026-10-26', 200)]
    const r = recentFoods(list)
    expect(r.map((m) => m.note)).toEqual(['Ovo mexido', 'arroz e frango'])
    expect(r[1].kcal).toBe(650) // a versão mais recente
  })

  it('calorias por dia e porcentagem da meta', () => {
    expect(kcalByDate([meal('a', '2026-10-26', 300), meal('b', '2026-10-27', 100)], ['2026-10-26', '2026-10-27', '2026-10-28'])).toEqual([300, 100, 0])
    expect(goalPercent(1500, 2000)).toBe(75)
    expect(goalPercent(3000, 2000)).toBe(100)
    expect(goalPercent(100, 0)).toBe(0)
  })
})
