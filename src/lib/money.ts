import type { DateKey, Expense } from '../types'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number): string {
  return brl.format(value)
}

/** "12,50", "1.234,56", "12.5" → 12.5; devolve null se não for um valor positivo. */
export function parseAmount(text: string): number | null {
  let t = text.replace(/[^\d.,]/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if ((t.match(/\./g) ?? []).length > 1) t = t.replace(/\./g, '')
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

/** "2026-10" a partir de uma data. */
export function monthOf(key: DateKey): string {
  return key.slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const EXPENSE_CATEGORIES = ['Mercado', 'Alimentação', 'Transporte', 'Casa', 'Contas', 'Saúde', 'Lazer', 'Outros']

export interface MonthSummary {
  out: number
  in: number
  balance: number
  byCategory: { category: string; total: number }[]
}

export function monthSummary(expenses: Expense[], month: string): MonthSummary {
  const list = expenses.filter((e) => monthOf(e.date) === month)
  const out = list.filter((e) => e.type === 'out').reduce((n, e) => n + e.amount, 0)
  const inn = list.filter((e) => e.type === 'in').reduce((n, e) => n + e.amount, 0)
  const cats = new Map<string, number>()
  for (const e of list) if (e.type === 'out') cats.set(e.category, (cats.get(e.category) ?? 0) + e.amount)
  return {
    out: round(out),
    in: round(inn),
    balance: round(inn - out),
    byCategory: [...cats.entries()].map(([category, total]) => ({ category, total: round(total) })).sort((a, b) => b.total - a.total),
  }
}

const round = (n: number) => Math.round(n * 100) / 100
