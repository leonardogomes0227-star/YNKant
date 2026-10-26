import { describe, expect, it } from 'vitest'
import {
  formatBR,
  formatClock,
  formatDuration,
  greeting,
  minToTime,
  nextOccurrence,
  quoteOfDay,
  timeToMin,
  weekKeys,
  weekStartKey,
  weekdayOf,
} from './dates'

describe('datas', () => {
  it('formata dd/mm/aaaa', () => {
    expect(formatBR('2026-10-26')).toBe('26/10/2026')
    expect(formatBR(null)).toBe('')
  })

  it('semana começa na segunda', () => {
    expect(weekStartKey('2026-10-26')).toBe('2026-10-26') // segunda
    expect(weekStartKey('2026-11-01')).toBe('2026-10-26') // domingo
    expect(weekKeys('2026-10-28')).toHaveLength(7)
    expect(weekKeys('2026-10-28')[6]).toBe('2026-11-01')
  })

  it('dia da semana', () => {
    expect(weekdayOf('2026-10-26')).toBe(1)
    expect(weekdayOf('2026-11-01')).toBe(0)
  })

  it('próxima ocorrência de tarefas recorrentes', () => {
    expect(nextOccurrence('2026-10-26', 'daily')).toBe('2026-10-27')
    expect(nextOccurrence('2026-10-26', 'weekly')).toBe('2026-11-02')
    expect(nextOccurrence('2026-01-31', 'monthly')).toBe('2026-02-28')
    expect(nextOccurrence('2026-10-26', 'none')).toBe('2026-10-26')
  })

  it('saudação por horário', () => {
    expect(greeting(3)).toBe('Boa madrugada')
    expect(greeting(9)).toBe('Bom dia')
    expect(greeting(15)).toBe('Boa tarde')
    expect(greeting(21)).toBe('Boa noite')
  })

  it('converte horários', () => {
    expect(timeToMin('08:30')).toBe(510)
    expect(minToTime(510)).toBe('08:30')
    expect(minToTime(2000)).toBe('24:00')
  })

  it('formata durações e relógio', () => {
    expect(formatDuration(0)).toBe('0min')
    expect(formatDuration(45 * 60)).toBe('45min')
    expect(formatDuration(90 * 60)).toBe('1h30')
    expect(formatDuration(2 * 3600)).toBe('2h')
    expect(formatClock(1500)).toBe('25:00')
    expect(formatClock(59.2)).toBe('01:00')
  })

  it('frase do dia é estável no mesmo dia', () => {
    expect(quoteOfDay('2026-10-26')).toBe(quoteOfDay('2026-10-26'))
  })
})
