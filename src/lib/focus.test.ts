import { describe, expect, it } from 'vitest'
import { secondsByDate, secondsInDates } from './focus'
import type { FocusSession } from '../types'

const s = (date: string, seconds: number): FocusSession => ({ id: date + seconds, startedAt: '', date, seconds, taskId: null })

describe('foco', () => {
  const sessions = [s('2026-10-26', 1500), s('2026-10-26', 600), s('2026-10-27', 1500)]
  it('soma por dia', () => {
    expect(secondsByDate(sessions)).toEqual({ '2026-10-26': 2100, '2026-10-27': 1500 })
  })
  it('soma em um intervalo de datas', () => {
    expect(secondsInDates(sessions, ['2026-10-26', '2026-10-28'])).toBe(2100)
    expect(secondsInDates(sessions, [])).toBe(0)
  })
})
