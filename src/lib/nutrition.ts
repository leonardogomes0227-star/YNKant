import type { DateKey, Meal } from '../types'

export interface DayTotals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export function dayTotals(meals: Meal[]): DayTotals {
  const sum = (f: (m: Meal) => number | null) => Math.round(meals.reduce((n, m) => n + (f(m) ?? 0), 0))
  return { kcal: sum((m) => m.kcal), protein: sum((m) => m.protein), carbs: sum((m) => m.carbs), fat: sum((m) => m.fat) }
}

/** Comidas já anotadas, sem repetir, da mais recente para a mais antiga (para anotar de novo com 1 toque). */
export function recentFoods(meals: Meal[], limit = 8): Meal[] {
  const seen = new Set<string>()
  const out: Meal[] = []
  const sorted = [...meals].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  for (const m of sorted) {
    const k = m.note.trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(m)
    if (out.length >= limit) break
  }
  return out
}

export function kcalByDate(meals: Meal[], dates: DateKey[]): number[] {
  return dates.map((d) => dayTotals(meals.filter((m) => m.date === d)).kcal)
}

export function goalPercent(value: number, goal: number): number {
  return goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
}
