import { describe, expect, it } from 'vitest'
import { monthSummary, parseAmount, shiftMonth } from './money'
import type { Expense } from '../types'

const e = (type: 'out' | 'in', amount: number, category: string, date: string) =>
  ({ id: date + amount, type, amount, category, note: '', date, createdAt: '' }) as Expense

describe('valores', () => {
  it('entende vírgula, ponto e milhar', () => {
    expect(parseAmount('12,50')).toBe(12.5)
    expect(parseAmount('R$ 1.234,56')).toBe(1234.56)
    expect(parseAmount('12.5')).toBe(12.5)
    expect(parseAmount('1.234.567')).toBe(1234567)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('0')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
  })

  it('troca de mês, inclusive na virada do ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('resume o mês: total, entradas, saldo e por categoria', () => {
    const list = [
      e('out', 100.1, 'Mercado', '2026-10-02'),
      e('out', 50.2, 'Mercado', '2026-10-15'),
      e('out', 30, 'Lazer', '2026-10-20'),
      e('in', 1000, 'Outros', '2026-10-05'),
      e('out', 999, 'Casa', '2026-09-30'),
    ]
    const s = monthSummary(list, '2026-10')
    expect(s.out).toBe(180.3)
    expect(s.in).toBe(1000)
    expect(s.balance).toBe(819.7)
    expect(s.byCategory[0]).toEqual({ category: 'Mercado', total: 150.3 })
  })
})
