import { Check } from 'lucide-react'
import { colorHex } from '../../lib/colors'
import { formatShort, nowMinutes, timeToMin, WEEKDAY_LONG, weekdayOf } from '../../lib/dates'
import { blocksForDate, hourRange, layoutColumns } from '../../lib/routine'
import type { DateKey, RoutineBlock } from '../../types'

const PPM = 0.9

/** Visão semanal: grade em telas médias/grandes, lista por dia no celular. */
export function WeekGrid({
  days,
  routine,
  routineLog,
  today,
  now,
  onOpenDay,
  onOpenBlock,
}: {
  days: DateKey[]
  routine: RoutineBlock[]
  routineLog: Record<DateKey, string[]>
  today: DateKey
  now: Date
  onOpenDay: (d: DateKey) => void
  onOpenBlock: (b: RoutineBlock) => void
}) {
  const perDay = days.map((d) => blocksForDate(routine, d))
  const [from, to] = hourRange(perDay.flat())
  const height = (to - from) * PPM
  const hours = Array.from({ length: (to - from) / 60 }, (_, i) => from + i * 60)
  const nowMin = nowMinutes(now)

  return (
    <>
      {/* grade (md+) */}
      <div className="card hidden overflow-hidden md:block">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
          <div />
          {days.map((d) => (
            <button
              key={d}
              onClick={() => onOpenDay(d)}
              className={`py-2 text-center text-xs font-semibold capitalize transition-colors hover:bg-surface-2 ${d === today ? 'text-accent' : 'text-muted'}`}
              aria-label={`Abrir ${formatShort(d)}`}
            >
              {formatShort(d)}
            </button>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: '44px repeat(7, 1fr)', height }}>
          <div className="relative" aria-hidden>
            {hours.map((m) => (
              <span key={m} className="tabular absolute left-2 -translate-y-1/2 text-[10px] text-muted" style={{ top: (m - from) * PPM + 6 }}>
                {String(m / 60).padStart(2, '0')}h
              </span>
            ))}
          </div>
          {days.map((d, i) => {
            const blocks = perDay[i]
            const layout = layoutColumns(blocks)
            const done = routineLog[d] ?? []
            return (
              <div key={d} className={`relative border-l border-line ${d === today ? 'bg-accent-soft/40' : ''}`}>
                {hours.map((m) => (
                  <div key={m} className="absolute inset-x-0 border-t border-line/60" style={{ top: (m - from) * PPM }} aria-hidden />
                ))}
                <ul className="absolute inset-0 m-0 list-none p-0" aria-label={WEEKDAY_LONG[weekdayOf(d)]}>
                  {blocks.map((b) => {
                    const { col, cols } = layout.get(b.id) ?? { col: 0, cols: 1 }
                    const hex = colorHex(b.color)
                    const isDone = done.includes(b.id)
                    return (
                      <li
                        key={b.id}
                        className="absolute overflow-hidden rounded border-l-2"
                        style={{
                          top: (timeToMin(b.start) - from) * PPM,
                          height: (timeToMin(b.end) - timeToMin(b.start)) * PPM - 1,
                          left: `${(col / cols) * 100}%`,
                          width: `calc(${100 / cols}% - 1px)`,
                          borderColor: hex,
                          background: `color-mix(in srgb, ${hex} 22%, var(--surface))`,
                          opacity: isDone ? 0.6 : 1,
                        }}
                      >
                        <button onClick={() => onOpenBlock(b)} className="block size-full px-1 py-0.5 text-left text-[11px] font-medium leading-tight" aria-label={`${b.title}, ${b.start} às ${b.end}${isDone ? ', cumprido' : ''}`}>
                          <span className={`block truncate ${isDone ? 'line-through' : ''}`}>
                            {isDone && <Check size={10} className="mr-0.5 inline" aria-hidden />}
                            {b.title}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {d === today && nowMin >= from && nowMin <= to && (
                  <div className="pointer-events-none absolute inset-x-0 h-px bg-accent" style={{ top: (nowMin - from) * PPM }} aria-hidden />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* lista (celular) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {days.map((d, i) => {
          const done = routineLog[d] ?? []
          return (
            <section key={d} className={`card p-3 ${d === today ? 'border-accent/50' : ''}`} aria-label={formatShort(d)}>
              <button onClick={() => onOpenDay(d)} className={`mb-1 text-sm font-semibold capitalize ${d === today ? 'text-accent' : ''}`}>
                {WEEKDAY_LONG[weekdayOf(d)]} · {formatShort(d).split(', ')[1]}
              </button>
              {perDay[i].length === 0 ? (
                <p className="text-sm text-muted">Sem blocos.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-1">
                  {perDay[i].map((b) => (
                    <li key={b.id}>
                      <button onClick={() => onOpenBlock(b)} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-surface-2">
                        <span className="h-6 w-1 shrink-0 rounded" style={{ background: colorHex(b.color) }} aria-hidden />
                        <span className="tabular w-[84px] shrink-0 text-xs text-muted">{b.start}–{b.end}</span>
                        <span className={`min-w-0 flex-1 truncate text-sm ${done.includes(b.id) ? 'text-muted line-through' : ''}`}>{b.title}</span>
                        {done.includes(b.id) && <Check size={14} className="text-accent" aria-label="Cumprido" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
