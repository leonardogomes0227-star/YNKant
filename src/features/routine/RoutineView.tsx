import { useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react'
import { EmptyState, PageHeader, ProgressBar } from '../../components/ui'
import { formatLong, fromKey, shiftKey, todayKey, weekKeys, weekdayOf, WEEKDAY_LONG } from '../../lib/dates'
import { blocksForDate } from '../../lib/routine'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import type { DateKey, RoutineBlock } from '../../types'
import { BlockEditor, type BlockTarget } from './BlockEditor'
import { CopyDayDialog } from './CopyDayDialog'
import { DayTimeline } from './DayTimeline'
import { WeekGrid } from './WeekGrid'

export function RoutineView() {
  const now = useNow(30_000)
  const today = todayKey(now)
  const routine = useStore((s) => s.routine)
  const routineLog = useStore((s) => s.routineLog)
  const [mode, setMode] = useState<'dia' | 'semana'>('dia')
  const [date, setDate] = useState<DateKey>(today)
  const [target, setTarget] = useState<BlockTarget>(null)
  const [copying, setCopying] = useState(false)

  const weekday = weekdayOf(date)
  const blocks = blocksForDate(routine, date)
  const done = routineLog[date] ?? []
  const doneCount = blocks.filter((b) => done.includes(b.id)).length
  const step = mode === 'dia' ? 1 : 7
  const days = weekKeys(date)

  const openBlock = (b: RoutineBlock) => setTarget({ id: b.id })

  return (
    <>
      <PageHeader
        title="Rotina"
        subtitle="Seus blocos de horário, por dia da semana."
        actions={
          <>
            <button className="btn" onClick={() => setCopying(true)} disabled={blocks.length === 0}>
              <Copy size={16} aria-hidden /> <span className="hidden sm:inline">Copiar dia</span>
              <span className="sr-only sm:hidden">Copiar dia</span>
            </button>
            <button className="btn btn-primary" onClick={() => setTarget({ id: 'new', days: [weekday] })}>
              <Plus size={18} aria-hidden /> Novo bloco
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label="Modo de visualização">
          <button aria-pressed={mode === 'dia'} onClick={() => setMode('dia')}>Dia</button>
          <button aria-pressed={mode === 'semana'} onClick={() => setMode('semana')}>Semana</button>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setDate(shiftKey(date, -step))} aria-label={mode === 'dia' ? 'Dia anterior' : 'Semana anterior'}>
            <ChevronLeft size={20} />
          </button>
          <button className="btn btn-sm" onClick={() => setDate(today)} disabled={mode === 'dia' ? date === today : days.includes(today)}>
            Hoje
          </button>
          <button className="icon-btn" onClick={() => setDate(shiftKey(date, step))} aria-label={mode === 'dia' ? 'Próximo dia' : 'Próxima semana'}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {mode === 'dia' ? (
        <>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl">{formatLong(fromKey(date))}</h2>
            {blocks.length > 0 && (
              <span className="tabular text-sm text-muted">{doneCount}/{blocks.length} cumpridos</span>
            )}
          </div>
          {blocks.length > 0 && <ProgressBar className="mb-4" value={(doneCount / blocks.length) * 100} label="Blocos cumpridos" />}
          {blocks.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={`Sem blocos em ${WEEKDAY_LONG[weekday]}`}
              action={
                <button className="btn btn-primary" onClick={() => setTarget({ id: 'new', days: [weekday] })}>
                  <Plus size={18} aria-hidden /> Criar bloco
                </button>
              }
            >
              A rotina é um modelo por dia da semana: um bloco criado para {WEEKDAY_LONG[weekday]} aparece em toda {WEEKDAY_LONG[weekday]}. Você também pode copiar outro dia para cá.
            </EmptyState>
          ) : (
            <DayTimeline blocks={blocks} date={date} isToday={date === today} now={now} done={done} onOpen={openBlock} />
          )}
        </>
      ) : (
        <>
          <h2 className="mb-3 text-xl">
            Semana de {formatLong(fromKey(days[0])).split(', ')[1].replace(/ de \d+$/, '')} a {formatLong(fromKey(days[6])).split(', ')[1].replace(/ de \d+$/, '')}
          </h2>
          <WeekGrid
            days={days}
            routine={routine}
            routineLog={routineLog}
            today={today}
            now={now}
            onOpenDay={(d) => {
              setDate(d)
              setMode('dia')
            }}
            onOpenBlock={openBlock}
          />
        </>
      )}

      <BlockEditor target={target} onClose={() => setTarget(null)} />
      <CopyDayDialog from={weekday} open={copying} onClose={() => setCopying(false)} />
    </>
  )
}
