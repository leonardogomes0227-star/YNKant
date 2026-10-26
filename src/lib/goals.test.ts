import { describe, expect, it } from 'vitest'
import { deadlineInfo, goalProgress } from './goals'

describe('metas', () => {
  it('progresso manual limitado a 0–100', () => {
    expect(goalProgress({ autoProgress: false, milestones: [], progress: 45.4 })).toBe(45)
    expect(goalProgress({ autoProgress: false, milestones: [], progress: 150 })).toBe(100)
  })

  it('progresso automático pelos marcos', () => {
    const milestones = [
      { id: '1', title: 'a', done: true },
      { id: '2', title: 'b', done: false },
      { id: '3', title: 'c', done: false },
      { id: '4', title: 'd', done: true },
    ]
    expect(goalProgress({ autoProgress: true, milestones, progress: 10 })).toBe(50)
    // sem marcos, cai no valor manual
    expect(goalProgress({ autoProgress: true, milestones: [], progress: 10 })).toBe(10)
  })

  it('texto de prazo', () => {
    const t = '2026-10-26'
    expect(deadlineInfo(null, t, 0)).toBeNull()
    expect(deadlineInfo('2026-10-26', t, 10)?.label).toBe('Prazo é hoje')
    expect(deadlineInfo('2026-10-27', t, 10)?.label).toBe('Falta 1 dia')
    expect(deadlineInfo('2026-11-05', t, 10)?.label).toBe('Faltam 10 dias')
    expect(deadlineInfo('2026-10-24', t, 10)).toEqual({ label: 'Prazo vencido há 2 dias', late: true })
    expect(deadlineInfo('2026-10-24', t, 100)?.late).toBe(false)
  })
})
