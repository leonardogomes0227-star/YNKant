import { describe, expect, it } from 'vitest'
import { habitStats, heatLevel, heatmapRange } from './streak'
import { shiftKey } from './dates'

const ALL = [0, 1, 2, 3, 4, 5, 6]
const TODAY = '2026-10-28' // quarta-feira

function habit(over: Partial<Parameters<typeof habitStats>[0]> = {}) {
  return { days: ALL, target: 1, log: {}, createdAt: '2026-09-01', ...over }
}

function logDays(offsets: number[], value = 1) {
  return Object.fromEntries(offsets.map((o) => [shiftKey(TODAY, -o), value]))
}

describe('habitStats', () => {
  it('sequência atual conta hoje quando feito', () => {
    const s = habitStats(habit({ log: logDays([0, 1, 2]) }), TODAY)
    expect(s.current).toBe(3)
    expect(s.best).toBe(3)
  })

  it('hoje pendente não quebra a sequência', () => {
    const s = habitStats(habit({ log: logDays([1, 2, 3]) }), TODAY)
    expect(s.current).toBe(3)
  })

  it('um dia agendado perdido quebra a sequência', () => {
    const s = habitStats(habit({ log: logDays([0, 1, 3, 4, 5, 6]) }), TODAY)
    expect(s.current).toBe(2)
    expect(s.best).toBe(4)
  })

  it('ignora dias fora da frequência', () => {
    // só segunda e quarta: hoje (qua) e segunda 26/10 feitas, quarta anterior 21/10 feita
    const s = habitStats(
      habit({ days: [1, 3], log: { '2026-10-28': 1, '2026-10-26': 1, '2026-10-21': 1 } }),
      TODAY,
    )
    expect(s.current).toBe(3)
  })

  it('hábito de contagem só conclui ao atingir a meta', () => {
    const h = habit({ target: 8, log: { [TODAY]: 5, [shiftKey(TODAY, -1)]: 8 } })
    const s = habitStats(h, TODAY)
    expect(s.current).toBe(1)
  })

  it('taxa de conclusão em 30 dias', () => {
    const s = habitStats(habit({ createdAt: '2026-09-01', log: logDays([1, 2, 3, 4, 5]) }), TODAY)
    // 29 dias passados agendados (hoje pendente é ignorado), 5 feitos
    expect(s.scheduled).toBe(29)
    expect(s.completed).toBe(5)
    expect(s.rate).toBeCloseTo(5 / 29)
  })

  it('hábito novo: taxa considera só desde a criação', () => {
    const s = habitStats(habit({ createdAt: TODAY }), TODAY)
    expect(s.scheduled).toBe(0)
    expect(s.rate).toBe(0)
  })
})

describe('heatmapRange', () => {
  it('termina no domingo da semana atual e tem múltiplo de 7 dias', () => {
    const r = heatmapRange(TODAY, 13)
    expect(r).toHaveLength(91)
    expect(r[r.length - 1]).toBe('2026-11-01')
    expect(r).toContain(TODAY)
  })
})

describe('heatLevel', () => {
  it('gradua por progresso em hábitos de contagem', () => {
    const h = { target: 8, log: { a: 0, b: 2, c: 5, d: 8, e: 10 } as Record<string, number> }
    expect(heatLevel(h, 'x')).toBe(0)
    expect(heatLevel(h, 'b')).toBe(1)
    expect(heatLevel(h, 'c')).toBe(2)
    expect(heatLevel(h, 'd')).toBe(3)
    expect(heatLevel(h, 'e')).toBe(3)
  })
})
