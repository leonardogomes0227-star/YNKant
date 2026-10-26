import { Check, Copy } from 'lucide-react'
import { colorHex } from '../../lib/colors'
import { nowMinutes, timeToMin } from '../../lib/dates'
import { hourRange, layoutColumns } from '../../lib/routine'
import { useStore } from '../../store/useStore'
import type { DateKey, RoutineBlock } from '../../types'

const PX_PER_MIN = 1.3
const GUTTER = 52

export function DayTimeline({
  blocks,
  date,
  isToday,
  now,
  done,
  onOpen,
}: {
  blocks: RoutineBlock[]
  date: DateKey
  isToday: boolean
  now: Date
  done: string[]
  onOpen: (b: RoutineBlock) => void
}) {
  const toggleDone = useStore((s) => s.toggleBlockDone)
  const duplicateBlock = useStore((s) => s.duplicateBlock)
  const [from, to] = hourRange(blocks)
  const height = (to - from) * PX_PER_MIN
  const layout = layoutColumns(blocks)
  const nowMin = nowMinutes(now)
  const hours = Array.from({ length: (to - from) / 60 + 1 }, (_, i) => from + i * 60)

  return (
    <div className="card relative overflow-hidden" style={{ height: height + 24 }}>
      <div className="absolute inset-x-0 top-3" style={{ height }}>
        {hours.map((m) => (
          <div key={m} className="absolute inset-x-0 border-t border-line" style={{ top: (m - from) * PX_PER_MIN }} aria-hidden>
            <span className="tabular absolute -top-2.5 left-3 bg-surface pr-1 text-[11px] text-muted">
              {String(m / 60).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        <ul className="absolute inset-0 m-0 list-none p-0" aria-label="Blocos do dia">
          {blocks.map((b) => {
            const s = timeToMin(b.start)
            const e = timeToMin(b.end)
            const h = (e - s) * PX_PER_MIN
            const { col, cols } = layout.get(b.id) ?? { col: 0, cols: 1 }
            const isDone = done.includes(b.id)
            const current = isToday && s <= nowMin && nowMin < e
            const hex = colorHex(b.color)
            const compact = h < 58 || cols > 1
            return (
              <li
                key={b.id}
                className={`absolute flex items-start gap-1 overflow-hidden rounded-lg border-l-[3px] pr-1 ${current ? 'ring-2 ring-accent' : ''} ${isDone ? 'opacity-60' : ''}`}
                style={{
                  top: (s - from) * PX_PER_MIN + 1,
                  height: h - 2,
                  left: `calc(${GUTTER}px + (100% - ${GUTTER + 8}px) * ${col / cols})`,
                  width: `calc((100% - ${GUTTER + 8}px) / ${cols} - 3px)`,
                  borderColor: hex,
                  background: `color-mix(in srgb, ${hex} 18%, var(--surface))`,
                }}
                aria-current={current ? 'time' : undefined}
              >
                <button
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={isDone ? `Desmarcar “${b.title}” como cumprido` : `Marcar “${b.title}” como cumprido`}
                  onClick={() => toggleDone(date, b.id)}
                  className="grid size-9 shrink-0 place-items-center"
                >
                  <span
                    className="grid size-5 place-items-center rounded-full border-[1.5px]"
                    style={{ borderColor: hex, background: isDone ? hex : 'transparent', color: 'var(--accent-fg)' }}
                  >
                    {isDone && <Check size={12} strokeWidth={3.5} />}
                  </span>
                </button>
                <button onClick={() => onOpen(b)} className="min-w-0 flex-1 py-1 text-left" aria-label={`Editar bloco “${b.title}”, ${b.start} às ${b.end}`}>
                  <span className={`block truncate text-sm font-semibold leading-tight ${isDone ? 'line-through' : ''}`}>
                    {b.title}
                    {current && <span className="chip chip-accent ml-2 align-middle">Agora</span>}
                  </span>
                  {compact ? (
                    cols === 1 && <span className="tabular block truncate text-xs text-muted">{b.start}–{b.end}{b.category ? ` · ${b.category}` : ''}</span>
                  ) : (
                    <span className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      {b.start}–{b.end}
                      {b.category && <span>· {b.category}</span>}
                    </span>
                  )}
                </button>
                {!compact && (
                  <button
                    className="icon-btn icon-btn-sm mt-0.5 hidden sm:inline-grid"
                    onClick={() => duplicateBlock(b.id)}
                    aria-label={`Duplicar bloco “${b.title}”`}
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {isToday && nowMin >= from && nowMin <= to && (
          <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: (nowMin - from) * PX_PER_MIN }} aria-hidden>
            <div className="absolute left-1 top-0 -translate-y-1/2 rounded bg-accent px-1 text-[10px] font-bold text-accent-fg">AGORA</div>
            <div className="h-px bg-accent" style={{ marginLeft: GUTTER - 4 }} />
            <div className="absolute size-2 -translate-y-1/2 rounded-full bg-accent" style={{ left: GUTTER - 8 }} />
          </div>
        )}
      </div>
    </div>
  )
}
