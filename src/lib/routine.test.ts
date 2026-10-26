import { describe, expect, it } from 'vitest'
import { blocksForDate, copyDayBlocks, currentBlock, hourRange, layoutColumns, nextBlock, overlaps } from './routine'
import type { RoutineBlock } from '../types'

const mk = (id: string, start: string, end: string, days: number[]): RoutineBlock => ({
  id,
  title: id,
  start,
  end,
  color: 'brass',
  category: '',
  days,
})

const blocks = [
  mk('b', '12:00', '13:00', [1, 2, 3, 4, 5]),
  mk('a', '09:00', '11:00', [1, 2, 3, 4, 5]),
  mk('s', '10:00', '12:00', [6]),
]

describe('rotina', () => {
  it('aplica o modelo pelo dia da semana e ordena por horário', () => {
    // 2026-10-26 é segunda; 2026-10-31 é sábado
    expect(blocksForDate(blocks, '2026-10-26').map((b) => b.id)).toEqual(['a', 'b'])
    expect(blocksForDate(blocks, '2026-10-31').map((b) => b.id)).toEqual(['s'])
    expect(blocksForDate(blocks, '2026-11-01')).toEqual([])
  })

  it('bloco atual e próximo', () => {
    const day = blocksForDate(blocks, '2026-10-26')
    expect(currentBlock(day, 9 * 60 + 30)?.id).toBe('a')
    expect(currentBlock(day, 11 * 60 + 30)).toBeNull()
    expect(currentBlock(day, 11 * 60)).toBeNull() // fim é exclusivo
    expect(nextBlock(day, 11 * 60 + 30)?.id).toBe('b')
    expect(nextBlock(day, 14 * 60)).toBeNull()
  })

  it('detecta sobreposição', () => {
    expect(overlaps(mk('x', '09:00', '10:00', []), mk('y', '09:30', '11:00', []))).toBe(true)
    expect(overlaps(mk('x', '09:00', '10:00', []), mk('y', '10:00', '11:00', []))).toBe(false)
  })

  it('coloca blocos sobrepostos em colunas', () => {
    const l = layoutColumns([mk('x', '09:00', '10:00', []), mk('y', '09:30', '11:00', []), mk('z', '12:00', '13:00', [])])
    expect(l.get('x')).toEqual({ col: 0, cols: 2 })
    expect(l.get('y')).toEqual({ col: 1, cols: 2 })
    expect(l.get('z')).toEqual({ col: 0, cols: 1 })
  })

  it('faixa de horas com folga', () => {
    expect(hourRange([])).toEqual([420, 1260])
    expect(hourRange([mk('x', '09:30', '11:10', [])])).toEqual([480, 720 + 60])
  })

  it('copiar dia substitui os blocos do destino', () => {
    const list = [
      mk('seg', '09:00', '10:00', [1, 2]), // segunda e terça
      mk('sab', '09:00', '12:00', [6]),
      mk('dom', '10:00', '11:00', [0]),
    ]
    const out = copyDayBlocks(list, 1, [6, 0])
    // sábado e domingo perdem seus blocos antigos e ganham o de segunda
    expect(out.map((b) => b.id)).toEqual(['seg'])
    expect(out[0].days).toEqual([0, 1, 2, 6])
  })

  it('copiar dia não mexe em blocos de outros dias', () => {
    const list = [mk('a', '09:00', '10:00', [1]), mk('b', '09:00', '10:00', [3, 6])]
    const out = copyDayBlocks(list, 1, [6])
    expect(out.find((b) => b.id === 'b')?.days).toEqual([3])
    expect(out.find((b) => b.id === 'a')?.days).toEqual([1, 6])
  })
})
