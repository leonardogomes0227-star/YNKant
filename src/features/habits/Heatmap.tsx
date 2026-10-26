import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatBR, fromKey } from '../../lib/dates'
import { heatLevel, heatmapRange, isFuture } from '../../lib/streak'
import type { DateKey, Habit } from '../../types'

/** Calendário de calor dos últimos 3 meses (13 semanas, colunas = semanas começando na segunda). */
export function Heatmap({ habit, today }: { habit: Habit; today: DateKey }) {
  const days = heatmapRange(today, 13)
  const total = Object.entries(habit.log).filter(([k]) => k <= today && heatLevel(habit, k) === 3).length
  const monthLabels = days
    .filter((_, i) => i % 7 === 0)
    .map((d, i, arr) => {
      const m = format(fromKey(d), 'MMM', { locale: ptBR })
      return i === 0 || m !== format(fromKey(arr[i - 1]), 'MMM', { locale: ptBR }) ? m : ''
    })

  return (
    <figure className="m-0 max-w-md" aria-label={`Calendário de calor de ${habit.name}: ${total} dias concluídos nos últimos 3 meses`}>
      <div className="grid gap-x-[3px]" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }} aria-hidden>
        {monthLabels.map((m, i) => (
          <span key={i} className="h-4 overflow-visible whitespace-nowrap text-[10px] capitalize text-muted">
            {m}
          </span>
        ))}
      </div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateRows: 'repeat(7, auto)', gridAutoFlow: 'column', gridAutoColumns: '1fr' }}
        role="img"
        aria-label={`${total} dias concluídos`}
      >
        {days.map((d) => {
          if (isFuture(d, today)) return <span key={d} className="aspect-square" />
          const level = heatLevel(habit, d)
          const v = habit.log[d] ?? 0
          return (
            <span
              key={d}
              className="heat-cell aspect-square"
              data-level={level}
              data-today={d === today}
              title={`${formatBR(d)}${habit.kind === 'count' ? `: ${v}/${habit.target}` : level === 3 ? ': feito' : ''}`}
            />
          )
        })}
      </div>
    </figure>
  )
}
