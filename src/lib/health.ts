import type { DateKey, Meal, MealType } from '../types'

export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche' },
  { id: 'jantar', label: 'Jantar' },
]

/** 250 → "250 ml"; 1500 → "1,5 L"; 2000 → "2 L" */
export function formatMl(ml: number): string {
  if (ml < 1000) return `${ml} ml`
  const l = Math.round(ml / 10) / 100
  return `${String(l).replace('.', ',')} L`
}

export function waterPercent(ml: number, goal: number): number {
  return goal > 0 ? Math.min(100, Math.round((ml / goal) * 100)) : 0
}

export function mealsOfDay(meals: Meal[], date: DateKey): Meal[] {
  const order = MEAL_TYPES.map((m) => m.id)
  return meals
    .filter((m) => m.date === date)
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.createdAt.localeCompare(b.createdAt))
}

export function totalKcal(meals: Meal[]): number {
  return meals.reduce((n, m) => n + (m.kcal ?? 0), 0)
}
