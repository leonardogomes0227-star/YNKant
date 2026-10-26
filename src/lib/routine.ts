import type { DateKey, RoutineBlock } from '../types'
import { timeToMin, weekdayOf } from './dates'


export function blocksForDay(blocks: RoutineBlock[], weekday: number): RoutineBlock[] {
  return blocks.filter((b) => b.days.includes(weekday)).sort(byStart)
}

export function blocksForDate(blocks: RoutineBlock[], key: DateKey): RoutineBlock[] {
  return blocksForDay(blocks, weekdayOf(key))
}

function byStart(a: RoutineBlock, b: RoutineBlock): number {
  return timeToMin(a.start) - timeToMin(b.start) || timeToMin(a.end) - timeToMin(b.end)
}

/** Bloco em andamento (início ≤ agora < fim). */
export function currentBlock(blocks: RoutineBlock[], minutes: number): RoutineBlock | null {
  return blocks.find((b) => timeToMin(b.start) <= minutes && minutes < timeToMin(b.end)) ?? null
}

/** Próximo bloco que ainda não começou. */
export function nextBlock(blocks: RoutineBlock[], minutes: number): RoutineBlock | null {
  return blocks.find((b) => timeToMin(b.start) > minutes) ?? null
}

/** Pares de blocos que se sobrepõem (para avisar o usuário, sem impedir). */
export function overlaps(a: Pick<RoutineBlock, 'start' | 'end'>, b: Pick<RoutineBlock, 'start' | 'end'>): boolean {
  return timeToMin(a.start) < timeToMin(b.end) && timeToMin(b.start) < timeToMin(a.end)
}

/**
 * Distribui blocos sobrepostos em colunas lado a lado.
 * Retorna, para cada bloco, a coluna e o total de colunas do seu grupo.
 */
export function layoutColumns(blocks: RoutineBlock[]): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>()
  const sorted = [...blocks].sort(byStart)
  let group: RoutineBlock[] = []
  let groupEnd = -1

  const flush = () => {
    const colEnds: number[] = []
    const assigned: [RoutineBlock, number][] = []
    for (const b of group) {
      let col = colEnds.findIndex((end) => end <= timeToMin(b.start))
      if (col === -1) col = colEnds.length
      colEnds[col] = timeToMin(b.end)
      assigned.push([b, col])
    }
    for (const [b, col] of assigned) result.set(b.id, { col, cols: colEnds.length })
    group = []
    groupEnd = -1
  }

  for (const b of sorted) {
    if (group.length && timeToMin(b.start) >= groupEnd) flush()
    group.push(b)
    groupEnd = Math.max(groupEnd, timeToMin(b.end))
  }
  if (group.length) flush()
  return result
}

/** Faixa de horas (em minutos) exibida: cobre os blocos com 1h de folga (mín. 7h–21h). */
export function hourRange(blocks: RoutineBlock[]): [number, number] {
  if (!blocks.length) return [7 * 60, 21 * 60]
  const min = Math.min(...blocks.map((b) => timeToMin(b.start)))
  const max = Math.max(...blocks.map((b) => timeToMin(b.end)))
  return [Math.max(0, Math.floor((min - 60) / 60) * 60), Math.min(24 * 60, Math.ceil((max + 60) / 60) * 60)]
}

/**
 * Copia os blocos do dia `from` para os dias `to`: os blocos que esses dias já
 * tinham saem (substituição) e os do dia de origem passam a valer também neles.
 */
export function copyDayBlocks(blocks: RoutineBlock[], from: number, to: number[]): RoutineBlock[] {
  const targets = to.filter((d) => d !== from)
  return blocks
    .map((b) => (b.days.includes(from) ? b : { ...b, days: b.days.filter((d) => !targets.includes(d)) }))
    .filter((b) => b.days.length > 0)
    .map((b) => (b.days.includes(from) ? { ...b, days: [...new Set([...b.days, ...targets])].sort() } : b))
}
