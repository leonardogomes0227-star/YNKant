import { describe, expect, it } from 'vitest'
import { averageSleep, formatHours, sleepHours } from './sleep'

describe('sono', () => {
  it('conta as horas atravessando a meia-noite', () => {
    expect(sleepHours('23:30', '07:00')).toBe(7.5)
    expect(sleepHours('22:00', '06:00')).toBe(8)
    expect(sleepHours('01:00', '08:30')).toBe(7.5)
  })

  it('média só dos dias com registro', () => {
    const s = { a: { hours: 7, quality: 4 }, b: { hours: 8, quality: null } }
    expect(averageSleep(s, ['a', 'b', 'c'])).toBe(7.5)
    expect(averageSleep(s, ['c'])).toBeNull()
  })

  it('formata horas', () => {
    expect(formatHours(7.5)).toBe('7h30')
    expect(formatHours(8)).toBe('8h')
  })
})
