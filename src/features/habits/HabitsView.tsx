import { useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, Pencil, Plus, Trophy } from 'lucide-react'
import { EmptyState, PageHeader, SampleBadge } from '../../components/ui'
import { formatLong, fromKey, shiftKey, todayKey, WEEKDAY_SHORT, WEEKDAY_ORDER, weekdayOf } from '../../lib/dates'
import { habitStats, isDone, isScheduled } from '../../lib/streak'
import { useNow } from '../../lib/useNow'
import { useStore } from '../../store/useStore'
import type { DateKey, Habit } from '../../types'
import { HabitControl } from './HabitControl'
import { HabitEditor, type HabitTarget } from './HabitEditor'
import { Heatmap } from './Heatmap'

function scheduleText(days: number[]): string {
  if (days.length === 7) return 'Todos os dias'
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Dias úteis'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fins de semana'
  return WEEKDAY_ORDER.filter((d) => days.includes(d)).map((d) => WEEKDAY_SHORT[d]).join(', ')
}

function HabitCard({ habit, date, today, onEdit }: { habit: Habit; date: DateKey; today: DateKey; onEdit: () => void }) {
  const stats = habitStats(habit, today)
  const scheduled = isScheduled(habit, date)
  const done = isDone(habit, date)
  return (
    <article className="card metal p-4 sm:p-5" aria-label={habit.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-xl">
            <span className="truncate">{habit.name}</span>
            {habit.sample && <SampleBadge />}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {scheduleText(habit.days)}
            {habit.kind === 'count' && ` · meta ${habit.target}${habit.unit ? ` ${habit.unit}` : ''}/dia`}
            {habit.note && ` · ${habit.note}`}
          </p>
        </div>
        <button className="icon-btn icon-btn-sm" onClick={onEdit} aria-label={`Editar hábito “${habit.name}”`}>
          <Pencil size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2">
        <span className={`text-sm ${done ? 'font-semibold text-accent' : 'text-muted'}`}>
          {done ? 'Concluído' : scheduled ? 'Pendente' : 'Fora da frequência'}
          {date !== today && <span className="text-muted"> · {formatLong(fromKey(date)).split(', ')[1]}</span>}
        </span>
        <HabitControl habit={habit} date={date} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-muted">
            <Flame size={13} className="text-accent" aria-hidden /> Sequência
          </dt>
          <dd className="tabular m-0 font-display text-2xl">{stats.current}<span className="ml-1 text-xs font-sans text-muted">{stats.current === 1 ? 'dia' : 'dias'}</span></dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-muted">
            <Trophy size={13} className="text-accent" aria-hidden /> Melhor
          </dt>
          <dd className="tabular m-0 font-display text-2xl">{stats.best}<span className="ml-1 text-xs font-sans text-muted">{stats.best === 1 ? 'dia' : 'dias'}</span></dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Conclusão (30d)</dt>
          <dd className="tabular m-0 font-display text-2xl">{Math.round(stats.rate * 100)}<span className="ml-0.5 text-xs font-sans text-muted">%</span></dd>
        </div>
      </dl>

      <div className="mt-4">
        <Heatmap habit={habit} today={today} />
      </div>
    </article>
  )
}

export function HabitsView() {
  const now = useNow(60_000)
  const today = todayKey(now)
  const habits = useStore((s) => s.habits)
  const [date, setDate] = useState<DateKey>(today)
  const [target, setTarget] = useState<HabitTarget>(null)

  const shown = date > today ? today : date
  const dayHabits = habits.filter((h) => isScheduled(h, shown))
  const dayDone = dayHabits.filter((h) => isDone(h, shown)).length

  return (
    <>
      <PageHeader
        title="Hábitos"
        subtitle="Pequenas ações repetidas, todos os dias."
        actions={
          <button className="btn btn-primary" onClick={() => setTarget({ id: 'new' })}>
            <Plus size={18} aria-hidden /> Novo hábito
          </button>
        }
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Nenhum hábito ainda"
          action={
            <button className="btn btn-primary" onClick={() => setTarget({ id: 'new' })}>
              <Plus size={18} aria-hidden /> Criar o primeiro hábito
            </button>
          }
        >
          Hábitos são ações que você quer repetir: beber água, ler, treinar. Escolha os dias da semana e acompanhe sua sequência e um calendário de calor dos últimos 3 meses.
        </EmptyState>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{shown === today ? 'Hoje' : formatLong(fromKey(shown)).split(', ')[1]}</span>
              {' · '}
              <span className="tabular">{dayDone}/{dayHabits.length}</span> hábitos previstos concluídos ({WEEKDAY_SHORT[weekdayOf(shown)]})
            </p>
            <div className="flex items-center gap-1">
              <button className="icon-btn" onClick={() => setDate(shiftKey(shown, -1))} aria-label="Dia anterior">
                <ChevronLeft size={20} />
              </button>
              <button className="btn btn-sm" onClick={() => setDate(today)} disabled={shown === today}>Hoje</button>
              <button className="icon-btn" onClick={() => setDate(shiftKey(shown, 1))} disabled={shown >= today} aria-label="Próximo dia">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {habits.map((h) => (
              <HabitCard key={h.id} habit={h} date={shown} today={today} onEdit={() => setTarget({ id: h.id })} />
            ))}
          </div>
        </>
      )}
      <HabitEditor target={target} onClose={() => setTarget(null)} />
    </>
  )
}
